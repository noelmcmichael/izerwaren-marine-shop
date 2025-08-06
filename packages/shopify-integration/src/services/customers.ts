import type { ShopifyClient } from '../client';
import type { APICallResult } from '../types/shopify';

export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptsMarketing: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  addresses: ShopifyCustomerAddress[];
  ordersCount: number;
  totalSpent: string;
}

export interface ShopifyCustomerAddress {
  id: string;
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
  isDefault: boolean;
}

export class CustomerService {
  constructor(private client: ShopifyClient) {}

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<APICallResult<ShopifyCustomer>> {
    try {
      const query = `
        query getCustomer($id: ID!) {
          customer(id: $id) {
            id
            email
            firstName
            lastName
            phone
            acceptsMarketing
            createdAt
            updatedAt
            tags
            ordersCount
            totalSpentV2 {
              amount
              currencyCode
            }
            addresses {
              id
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
              default
            }
          }
        }
      `;

      const response = await this.client.query<{ customer: Record<string, unknown> }>(query, { id: customerId });

      if (!response.customer) {
        return {
          success: false,
          error: 'Customer not found',
        };
      }

      const customer: ShopifyCustomer = {
        id: response.customer.id,
        email: response.customer.email,
        firstName: response.customer.firstName,
        lastName: response.customer.lastName,
        phone: response.customer.phone,
        acceptsMarketing: response.customer.acceptsMarketing,
        createdAt: response.customer.createdAt,
        updatedAt: response.customer.updatedAt,
        tags: response.customer.tags,
        ordersCount: response.customer.ordersCount,
        totalSpent: response.customer.totalSpentV2.amount,
        addresses: response.customer.addresses.map((addr: Record<string, unknown>) => ({
          id: addr.id,
          firstName: addr.firstName,
          lastName: addr.lastName,
          company: addr.company,
          address1: addr.address1,
          address2: addr.address2,
          city: addr.city,
          province: addr.province,
          country: addr.country,
          zip: addr.zip,
          phone: addr.phone,
          isDefault: addr.default,
        })),
      };

      return {
        success: true,
        data: customer,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Search customers by email or name
   */
  async searchCustomers(
    query: string,
    first: number = 50
  ): Promise<APICallResult<ShopifyCustomer[]>> {
    try {
      const searchQuery = `
        query searchCustomers($query: String!, $first: Int!) {
          customers(first: $first, query: $query) {
            edges {
              node {
                id
                email
                firstName
                lastName
                phone
                createdAt
                ordersCount
                totalSpentV2 {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      `;

      const response = await this.client.query<{
        customers: {
          edges: Array<{ node: any }>;
        };
      }>(searchQuery, { query, first });

      const customers: ShopifyCustomer[] = response.customers.edges.map((edge: { node: Record<string, unknown> }) => ({
        id: edge.node.id,
        email: edge.node.email,
        firstName: edge.node.firstName,
        lastName: edge.node.lastName,
        phone: edge.node.phone,
        acceptsMarketing: false, // Not available in search results
        createdAt: edge.node.createdAt,
        updatedAt: edge.node.createdAt, // Not available in search results
        tags: [], // Not available in search results
        ordersCount: edge.node.ordersCount,
        totalSpent: edge.node.totalSpentV2.amount,
        addresses: [], // Not included in search results
      }));

      return {
        success: true,
        data: customers,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}