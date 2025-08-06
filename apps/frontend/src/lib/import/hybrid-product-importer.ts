// Main hybrid product import service

import { PrismaClient } from '@prisma/client';

import { revivalApi } from './revival-api-client';
import {
  RevivalProduct,
  RevivalVariableProduct,
  ImportResult,
  ImportProgress,
  VariantGroup,
} from './types';
import {
  generateVariantCombinations,
  generateVariantSku,
  generateVariantTitle,
  generateVariantHandle,
} from './variant-utils';

const prisma = new PrismaClient();

export class HybridProductImporter {
  private progressCallback?: (progress: ImportProgress) => void;

  constructor(progressCallback?: (progress: ImportProgress) => void) {
    this.progressCallback = progressCallback;
  }

  private updateProgress(
    phase: string,
    current: number,
    total: number,
    status: ImportProgress['status'],
    message?: string
  ) {
    if (this.progressCallback) {
      this.progressCallback({ phase, current, total, status, message });
    }
    console.log(`${phase}: ${current}/${total} - ${status} ${message || ''}`);
  }

  async importAll(): Promise<ImportResult> {
    try {
      this.updateProgress(
        'Starting Import',
        0,
        5,
        'in_progress',
        'Initializing hybrid product import'
      );

      // Get summary to validate API connection
      const summary = await revivalApi.getVariantSummary();
      console.log('Revival API Summary:', summary);

      const stats = {
        simpleProducts: 0,
        variableProducts: 0,
        variantGroups: 0,
        variantOptions: 0,
        productVariants: 0,
        technicalSpecs: 0,
        images: 0,
        catalogs: 0,
      };

      // Phase 1: Import all base products
      this.updateProgress(
        'Base Products',
        1,
        5,
        'in_progress',
        'Importing base product information'
      );
      const baseProductStats = await this.importBaseProducts();
      stats.simpleProducts = baseProductStats.simpleProducts;
      stats.variableProducts = baseProductStats.variableProducts;

      // Phase 2: Import variant structures for variable products
      this.updateProgress(
        'Variant Structures',
        2,
        5,
        'in_progress',
        'Creating variant groups and options'
      );
      const variantStats = await this.importVariantStructures();
      stats.variantGroups = variantStats.variantGroups;
      stats.variantOptions = variantStats.variantOptions;
      stats.productVariants = variantStats.productVariants;

      // Phase 3: Import technical specifications
      this.updateProgress(
        'Technical Specs',
        3,
        5,
        'in_progress',
        'Importing technical specifications'
      );
      const specStats = await this.importTechnicalSpecifications();
      stats.technicalSpecs = specStats.technicalSpecs;

      // Phase 4: Import product images (simplified for now)
      this.updateProgress('Product Images', 4, 5, 'in_progress', 'Processing product images');
      const imageStats = await this.importProductImages();
      stats.images = imageStats.images;

      // Phase 5: Import PDF catalogs (simplified for now)
      this.updateProgress('PDF Catalogs', 5, 5, 'in_progress', 'Processing PDF catalogs');
      const catalogStats = await this.importProductCatalogs();
      stats.catalogs = catalogStats.catalogs;

      this.updateProgress(
        'Completed',
        5,
        5,
        'completed',
        'Hybrid product import completed successfully'
      );

      return {
        success: true,
        message: 'Hybrid product import completed successfully',
        stats,
      };
    } catch (error) {
      this.updateProgress('Error', 0, 5, 'error', `Import failed: ${error}`);
      console.error('Import error:', error);

      return {
        success: false,
        message: `Import failed: ${error}`,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  private async importBaseProducts() {
    console.log('Fetching all products from Revival API...');
    const allProducts = await revivalApi.getAllProductsPaginated();
    const variableProducts = await revivalApi.getAllVariableProductsPaginated();

    console.log(
      `Found ${allProducts.length} total products, ${variableProducts.length} variable products`
    );

    const variableSkus = new Set(variableProducts.map(p => p.sku));
    let simpleCount = 0;
    let variableCount = 0;

    for (const product of allProducts) {
      const isVariable = variableSkus.has(product.sku);

      await prisma.product.upsert({
        where: { sku: product.sku },
        update: {
          title: product.name,
          description: product.description,
          price: product.price,
          retailPrice: product.retail_price,
          partNumber: product.part_number,
          categoryName: product.category_name,
          availability: product.availability,
          imageCount: product.image_count,
          primaryImagePath: product.primary_image_path,
          productType: isVariable ? 'VARIABLE' : 'SIMPLE',
          hasVariants: isVariable,
          variantCount: isVariable
            ? variableProducts.find(vp => vp.sku === product.sku)?.variant_count || 0
            : 0,
          handle: this.generateProductHandle(product.name),
          vendor: 'Izerwaren',
          status: 'active',
          tags: [product.main_category, product.category_name].filter(Boolean) as string[],
        },
        create: {
          sku: product.sku,
          title: product.name,
          description: product.description,
          price: product.price,
          retailPrice: product.retail_price,
          partNumber: product.part_number,
          categoryName: product.category_name,
          availability: product.availability,
          imageCount: product.image_count,
          primaryImagePath: product.primary_image_path,
          productType: isVariable ? 'VARIABLE' : 'SIMPLE',
          hasVariants: isVariable,
          variantCount: isVariable
            ? variableProducts.find(vp => vp.sku === product.sku)?.variant_count || 0
            : 0,
          handle: this.generateProductHandle(product.name),
          vendor: 'Izerwaren',
          status: 'active',
          tags: [product.main_category, product.category_name].filter(Boolean) as string[],
        },
      });

      if (isVariable) {
        variableCount++;
      } else {
        simpleCount++;
      }

      // Progress update every 50 products
      if ((simpleCount + variableCount) % 50 === 0) {
        console.log(`Processed ${simpleCount + variableCount}/${allProducts.length} products`);
      }
    }

    console.log(`Base products imported: ${simpleCount} simple, ${variableCount} variable`);
    return { simpleProducts: simpleCount, variableProducts: variableCount };
  }

  private async importVariantStructures() {
    const variableProducts = await revivalApi.getAllVariableProductsPaginated();

    let variantGroupCount = 0;
    let variantOptionCount = 0;
    let productVariantCount = 0;

    for (const variableProduct of variableProducts) {
      try {
        // Get the product record
        const product = await prisma.product.findUnique({
          where: { sku: variableProduct.sku },
        });

        if (!product) {
          console.warn(`Product not found for SKU: ${variableProduct.sku}`);
          continue;
        }

        // Parse the variants JSON
        const variants: Record<string, VariantGroup> = JSON.parse(variableProduct.variants_json);

        // Create variant groups and options
        for (const [groupName, groupData] of Object.entries(variants)) {
          // Create or find variant group
          const variantGroup = await prisma.productVariantGroup.upsert({
            where: {
              productId_name: {
                productId: product.id,
                name: groupName,
              },
            },
            update: {
              label: groupData.label,
              inputType:
                groupName === 'Handing' || groupName === 'Rimlock Handing' ? 'radio' : 'dropdown',
              required: groupName === 'Handing' || groupName === 'Rimlock Handing', // Make handing required
              sortOrder: this.getGroupSortOrder(groupName),
            },
            create: {
              productId: product.id,
              name: groupName,
              label: groupData.label,
              inputType:
                groupName === 'Handing' || groupName === 'Rimlock Handing' ? 'radio' : 'dropdown',
              required: groupName === 'Handing' || groupName === 'Rimlock Handing',
              sortOrder: this.getGroupSortOrder(groupName),
            },
          });

          variantGroupCount++;

          // Create variant options
          for (let i = 0; i < groupData.options.length; i++) {
            const option = groupData.options[i];

            await prisma.productVariantOption.upsert({
              where: {
                variantGroupId_value: {
                  variantGroupId: variantGroup.id,
                  value: option.value,
                },
              } as any,
              update: {
                displayText: option.text,
                sortOrder: i,
                priceModifier: this.getOptionPriceModifier(groupName, option.value),
              },
              create: {
                variantGroupId: variantGroup.id,
                value: option.value,
                displayText: option.text,
                sortOrder: i,
                priceModifier: this.getOptionPriceModifier(groupName, option.value),
              },
            });

            variantOptionCount++;
          }
        }

        // Generate product variants (individual SKU combinations)
        const combinations = generateVariantCombinations(variants);

        for (const combination of combinations) {
          const variantSku = generateVariantSku(product.sku!, combination);
          const variantTitle = generateVariantTitle(product.title, combination);
          const variantHandle = generateVariantHandle(product.sku!, combination);

          await prisma.catalogProductVariant.upsert({
            where: { sku: variantSku },
            update: {
              title: variantTitle,
              price: product.price, // Base price for now
            },
            create: {
              productId: product.id,
              sku: variantSku,
              title: variantTitle,
              price: product.price,
              inventoryQty: 0,
              isActive: true,
            },
          });

          // Create variant selections (links to options)
          for (const [groupName, optionValue] of Object.entries(combination)) {
            const variantGroup = await prisma.productVariantGroup.findFirst({
              where: {
                productId: product.id,
                name: groupName,
              },
            });

            if (variantGroup) {
              const variantOption = await prisma.productVariantOption.findFirst({
                where: {
                  variantGroupId: variantGroup.id,
                  value: optionValue,
                },
              });

              if (variantOption) {
                const productVariant = await prisma.catalogProductVariant.findUnique({
                  where: { sku: variantSku },
                });

                if (productVariant) {
                  await prisma.productVariantSelection.upsert({
                    where: {
                      variantId_optionId: {
                        variantId: productVariant.id,
                        optionId: variantOption.id,
                      },
                    },
                    update: {},
                    create: {
                      variantId: productVariant.id,
                      optionId: variantOption.id,
                    },
                  });
                }
              }
            }
          }

          productVariantCount++;
        }

        console.log(`Processed variants for ${product.sku}: ${combinations.length} combinations`);
      } catch (error) {
        console.error(`Error processing variants for ${variableProduct.sku}:`, error);
      }
    }

    console.log(
      `Variant structures imported: ${variantGroupCount} groups, ${variantOptionCount} options, ${productVariantCount} variants`
    );
    return {
      variantGroups: variantGroupCount,
      variantOptions: variantOptionCount,
      productVariants: productVariantCount,
    };
  }

  private async importTechnicalSpecifications() {
    const allProducts = await revivalApi.getAllProductsPaginated();
    let specCount = 0;

    for (const revivalProduct of allProducts) {
      try {
        const product = await prisma.product.findUnique({
          where: { sku: revivalProduct.sku },
        });

        if (!product) continue;

        // Get technical specifications
        const techSpecs = await revivalApi.getTechnicalSpecs(revivalProduct.sku);

        if (techSpecs.technical_specifications) {
          for (const [category, specs] of Object.entries(techSpecs.technical_specifications)) {
            for (const spec of specs) {
              await prisma.technicalSpecification.upsert({
                where: {
                  productId_category_value: {
                    productId: product.id,
                    category: spec.spec_category,
                    value: spec.spec_value,
                  },
                } as any,
                update: {
                  name: spec.spec_name,
                  unit: spec.spec_unit,
                  isSearchable: spec.is_searchable,
                },
                create: {
                  productId: product.id,
                  category: spec.spec_category,
                  name: spec.spec_name,
                  value: spec.spec_value,
                  unit: spec.spec_unit,
                  isSearchable: spec.is_searchable,
                },
              });

              specCount++;
            }
          }
        }

        if (specCount % 1000 === 0) {
          console.log(`Processed ${specCount} technical specifications`);
        }
      } catch (error) {
        console.error(`Error processing technical specs for ${revivalProduct.sku}:`, error);
      }
    }

    console.log(`Technical specifications imported: ${specCount}`);
    return { technicalSpecs: specCount };
  }

  private async importProductImages() {
    // Simplified image import - just create placeholder records
    // In a full implementation, this would copy actual image files

    const products = await prisma.product.findMany({
      where: {
        imageCount: {
          gt: 0,
        },
      },
    });

    let imageCount = 0;

    for (const product of products) {
      if (product.primaryImagePath) {
        await prisma.productImage.upsert({
          where: {
            productId_localPath: {
              productId: product.id,
              localPath: product.primaryImagePath,
            },
          } as any,
          update: {
            isPrimary: true,
            fileExists: false, // Set to true after actual file copy
            imageOrder: 0,
          },
          create: {
            productId: product.id,
            localPath: product.primaryImagePath,
            isPrimary: true,
            fileExists: false,
            imageOrder: 0,
          },
        });

        imageCount++;
      }
    }

    console.log(`Product image records created: ${imageCount}`);
    return { images: imageCount };
  }

  private async importProductCatalogs() {
    // Simplified catalog import - create placeholder records
    // In a full implementation, this would handle PDF downloads

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { description: { contains: 'catalog', mode: 'insensitive' } },
          { description: { contains: 'specification', mode: 'insensitive' } },
        ],
      },
    });

    let catalogCount = 0;

    for (const product of products) {
      await prisma.productCatalog.upsert({
        where: {
          productId: product.id,
        } as any,
        update: {
          downloadStatus: 'pending',
        },
        create: {
          productId: product.id,
          pdfUrl: `https://example.com/catalogs/${product.sku}.pdf`,
          localPdfPath: `/storage/catalogs/${product.sku}.pdf`,
          downloadStatus: 'pending',
        },
      });

      catalogCount++;
    }

    console.log(`Product catalog records created: ${catalogCount}`);
    return { catalogs: catalogCount };
  }

  // Utility methods
  private generateProductHandle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private getGroupSortOrder(groupName: string): number {
    const order = {
      Handing: 1,
      'Rimlock Handing': 1,
      'Door Thickness': 2,
      'Profile Cylinder Type': 3,
      'Tubular Latch Function': 4,
      'Chrome Plating': 5,
      'Key Rose Thickness': 6,
      'Magnetic Door Holder Light Duty': 7,
      'Keyed alike': 8,
      'Glass Thickness for Strike Box #82.1124': 9,
    };
    return order[groupName as keyof typeof order] || 10;
  }

  private getOptionPriceModifier(groupName: string, optionValue: string): number {
    // Define price modifiers for premium options
    const modifiers: Record<string, Record<string, number>> = {
      'Profile Cylinder Type': {
        'Key-Key': 50.0, // $50 premium for Key-Key vs Key-Knob
      },
      'Chrome Plating': {
        'Polished Chrome': 25.0, // $25 premium for polished chrome
      },
      'Door Thickness': {
        '2 1/2 inch': 15.0, // $15 premium for thickest doors
      },
    };

    return modifiers[groupName]?.[optionValue] || 0;
  }
}

export const hybridProductImporter = new HybridProductImporter();
