import type { ShopifyClient } from '../client';
import type { APICallResult } from '../types/shopify';

export class InventoryService {
  constructor(private client: ShopifyClient) {}

  /**
   * Update inventory quantity for a variant
   */
  async updateInventoryQuantity(
    variantId: string,
    quantity: number,
    // locationId?: string
  ): Promise<APICallResult<boolean>> {
    try {
      const mutation = `
        mutation inventoryAdjustQuantity($input: InventoryAdjustQuantityInput!) {
          inventoryAdjustQuantity(input: $input) {
            inventoryLevel {
              id
              available
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        input: {
          inventoryLevelId: `gid://shopify/InventoryLevel/${variantId}?inventory_item_id=${variantId}`,
          availableDelta: quantity,
        },
      };

      const response = await this.client.mutation<{
        inventoryAdjustQuantity: {
          inventoryLevel?: { id: string; available: number };
          userErrors: Array<{ field: string[]; message: string }>;
        };
      }>(mutation, variables);

      if (response.inventoryAdjustQuantity.userErrors.length > 0) {
        return {
          success: false,
          error: response.inventoryAdjustQuantity.userErrors
            .map(err => err.message)
            .join(', '),
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get inventory levels for a product
   */
  async getInventoryLevels(productId: string): Promise<APICallResult<Array<{
    variantId: string;
    available: number;
    locationId: string;
  }>>> {
    try {
      const query = `
        query getInventoryLevels($id: ID!) {
          product(id: $id) {
            variants(first: 100) {
              edges {
                node {
                  id
                  inventoryItem {
                    id
                    inventoryLevels(first: 10) {
                      edges {
                        node {
                          id
                          available
                          location {
                            id
                            name
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await this.client.query<{
        product: {
          variants: {
            edges: Array<{
              node: {
                id: string;
                inventoryItem: {
                  inventoryLevels: {
                    edges: Array<{
                      node: {
                        available: number;
                        location: { id: string; name: string };
                      };
                    }>;
                  };
                };
              };
            }>;
          };
        };
      }>(query, { id: productId });

      const levels = response.product.variants.edges.flatMap(variant =>
        variant.node.inventoryItem.inventoryLevels.edges.map(level => ({
          variantId: variant.node.id,
          available: level.node.available,
          locationId: level.node.location.id,
        }))
      );

      return {
        success: true,
        data: levels,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}