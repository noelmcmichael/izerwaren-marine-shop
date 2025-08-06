import type { ShopifyClient } from '../client';
import type { APICallResult } from '../types/shopify';

export interface ShopifyOrder {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  totalPrice: string;
  subtotalPrice: string;
  totalTax: string;
  currency: string;
  financialStatus: string;
  fulfillmentStatus: string;
  lineItems: ShopifyLineItem[];
  shippingAddress?: ShopifyAddress;
  billingAddress?: ShopifyAddress;
}

export interface ShopifyLineItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  quantity: number;
  price: string;
  sku: string;
}

export interface ShopifyAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone?: string;
}

export class OrderService {
  constructor(private client: ShopifyClient) {}

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<APICallResult<ShopifyOrder>> {
    try {
      const query = `
        query getOrder($id: ID!) {
          order(id: $id) {
            id
            name
            email
            createdAt
            updatedAt
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            subtotalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            totalTaxSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            financialStatus
            fulfillmentStatus
            lineItems(first: 100) {
              edges {
                node {
                  id
                  title
                  quantity
                  variant {
                    id
                    product {
                      id
                    }
                    sku
                    price
                  }
                }
              }
            }
            shippingAddress {
              firstName
              lastName
              company
              address1
              address2
              city
              province
              country
              zip
              phone
            }
            billingAddress {
              firstName
              lastName
              company
              address1
              address2
              city
              province
              country
              zip
              phone
            }
          }
        }
      `;

      const response = await this.client.query<{ order: any }>(query, { id: orderId });

      if (!response.order) {
        return {
          success: false,
          error: 'Order not found',
        };
      }

      const order: ShopifyOrder = {
        id: response.order.id,
        name: response.order.name,
        email: response.order.email,
        createdAt: response.order.createdAt,
        updatedAt: response.order.updatedAt,
        totalPrice: response.order.totalPriceSet.shopMoney.amount,
        subtotalPrice: response.order.subtotalPriceSet.shopMoney.amount,
        totalTax: response.order.totalTaxSet.shopMoney.amount,
        currency: response.order.totalPriceSet.shopMoney.currencyCode,
        financialStatus: response.order.financialStatus,
        fulfillmentStatus: response.order.fulfillmentStatus,
        lineItems: response.order.lineItems.edges.map((edge: any) => ({
          id: edge.node.id,
          productId: edge.node.variant.product.id,
          variantId: edge.node.variant.id,
          title: edge.node.title,
          quantity: edge.node.quantity,
          price: edge.node.variant.price,
          sku: edge.node.variant.sku,
        })),
        shippingAddress: response.order.shippingAddress,
        billingAddress: response.order.billingAddress,
      };

      return {
        success: true,
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * List orders with pagination
   */
  async listOrders(
    first: number = 50,
    after?: string,
    query?: string
  ): Promise<APICallResult<{
    orders: ShopifyOrder[];
    hasNextPage: boolean;
    endCursor?: string;
  }>> {
    try {
      const gqlQuery = `
        query listOrders($first: Int!, $after: String, $query: String) {
          orders(first: $first, after: $after, query: $query) {
            edges {
              node {
                id
                name
                email
                createdAt
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                financialStatus
                fulfillmentStatus
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const response = await this.client.query<{
        orders: {
          edges: Array<{ node: any }>;
          pageInfo: { hasNextPage: boolean; endCursor?: string };
        };
      }>(gqlQuery, { first, after, query });

      const orders: ShopifyOrder[] = response.orders.edges.map(edge => ({
        id: edge.node.id,
        name: edge.node.name,
        email: edge.node.email,
        createdAt: edge.node.createdAt,
        updatedAt: edge.node.updatedAt || edge.node.createdAt,
        totalPrice: edge.node.totalPriceSet.shopMoney.amount,
        subtotalPrice: '0', // Not available in list view
        totalTax: '0', // Not available in list view
        currency: edge.node.totalPriceSet.shopMoney.currencyCode,
        financialStatus: edge.node.financialStatus,
        fulfillmentStatus: edge.node.fulfillmentStatus,
        lineItems: [], // Not included in list view
      }));

      return {
        success: true,
        data: {
          orders,
          hasNextPage: response.orders.pageInfo.hasNextPage,
          endCursor: response.orders.pageInfo.endCursor,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}