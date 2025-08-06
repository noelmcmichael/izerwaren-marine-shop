"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryMappingService = exports.categoryMappingService = exports.ProductSearchResponseSchema = exports.SearchParamsSchema = exports.PaginationSchema = exports.ApiResponseSchema = exports.ProductPDFSchema = exports.ImageGallerySchema = exports.MediaAssetSchema = exports.TechnicalSpecificationSchema = exports.ProductVariantSchema = exports.ProductSchema = void 0;
// Schemas (with aliases to avoid conflicts)
var product_1 = require("./schemas/product");
Object.defineProperty(exports, "ProductSchema", { enumerable: true, get: function () { return product_1.ProductSchema; } });
Object.defineProperty(exports, "ProductVariantSchema", { enumerable: true, get: function () { return product_1.ProductVariantSchema; } });
Object.defineProperty(exports, "TechnicalSpecificationSchema", { enumerable: true, get: function () { return product_1.TechnicalSpecificationSchema; } });
var media_1 = require("./schemas/media");
Object.defineProperty(exports, "MediaAssetSchema", { enumerable: true, get: function () { return media_1.MediaAssetSchema; } });
Object.defineProperty(exports, "ImageGallerySchema", { enumerable: true, get: function () { return media_1.ImageGallerySchema; } });
Object.defineProperty(exports, "ProductPDFSchema", { enumerable: true, get: function () { return media_1.ProductPDFSchema; } });
var api_1 = require("./schemas/api");
Object.defineProperty(exports, "ApiResponseSchema", { enumerable: true, get: function () { return api_1.ApiResponseSchema; } });
Object.defineProperty(exports, "PaginationSchema", { enumerable: true, get: function () { return api_1.PaginationSchema; } });
Object.defineProperty(exports, "SearchParamsSchema", { enumerable: true, get: function () { return api_1.SearchParamsSchema; } });
Object.defineProperty(exports, "ProductSearchResponseSchema", { enumerable: true, get: function () { return api_1.ProductSearchResponseSchema; } });
// Services
var categoryMappingService_1 = require("./services/categoryMappingService");
Object.defineProperty(exports, "categoryMappingService", { enumerable: true, get: function () { return categoryMappingService_1.categoryMappingService; } });
Object.defineProperty(exports, "CategoryMappingService", { enumerable: true, get: function () { return categoryMappingService_1.CategoryMappingService; } });
// Constants
__exportStar(require("./constants/categoryMappings"), exports);
// Utilities
__exportStar(require("./utils/validation"), exports);
__exportStar(require("./utils/formatting"), exports);
