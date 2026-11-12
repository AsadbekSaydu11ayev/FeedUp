//
//  Models.swift
//  FeedUp iOS App
//

import Foundation

// MARK: - Category Model
public struct Category: Identifiable, Codable, Hashable {
    public let id: Int
    public let name: String
    public let slug: String
    public let icon: String
    public let sortOrder: Int?
    public let productCount: Int?

    enum CodingKeys: String, CodingKey {
        case id, name, slug, icon
        case sortOrder = "sort_order"
        case productCount = "product_count"
    }
}

// MARK: - Product Model
public struct Product: Identifiable, Codable, Hashable {
    public let id: Int
    public let categoryId: Int
    public let categoryName: String?
    public let categoryIcon: String?
    public let name: String
    public let description: String?
    public let price: Double
    public let oldPrice: Double?
    public let calories: Int
    public let prepTimeMin: Int
    public let imageUrl: String
    public let isAvailable: Int

    public var isProductAvailable: Bool {
        return isAvailable == 1
    }

    public var hasDiscount: Bool {
        guard let oldPrice = oldPrice else { return false }
        return oldPrice > price
    }

    public var discountPercent: Int? {
        guard let oldPrice = oldPrice, oldPrice > price, oldPrice > 0 else { return nil }
        return Int(((oldPrice - price) / oldPrice * 100).rounded())
    }

    public var formattedPrice: String {
        Self.formatCurrency(price)
    }

    public var formattedOldPrice: String? {
        guard let oldPrice = oldPrice else { return nil }
        return Self.formatCurrency(oldPrice)
    }

    public var resolvedImageURL: URL? {
        FeedUpAPIService.shared.resolveMediaURL(from: imageUrl)
    }

    private static func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.groupingSeparator = " "
        let formatted = formatter.string(from: NSNumber(value: amount)) ?? "\(Int(amount))"
        return "\(formatted) so'm"
    }

    enum CodingKeys: String, CodingKey {
        case id, name, description, price, calories
        case categoryId = "category_id"
        case categoryName = "category_name"
        case categoryIcon = "category_icon"
        case oldPrice = "old_price"
        case prepTimeMin = "prep_time_min"
        case imageUrl = "image_url"
        case isAvailable = "is_available"
    }
}

// MARK: - Order Status Enum
public enum OrderStatus: String, Codable, CaseIterable {
    case pending = "pending"
    case preparing = "preparing"
    case onTheWay = "on_the_way"
    case delivered = "delivered"
    case cancelled = "cancelled"

    public var title: String {
        switch self {
        case .pending: return "Kutilmoqda"
        case .preparing: return "Tayyorlanmoqda"
        case .onTheWay: return "Yo'lda"
        case .delivered: return "Yetkazildi"
        case .cancelled: return "Bekor qilindi"
        }
    }

    public var subtitle: String {
        switch self {
        case .pending: return "Buyurtmangiz tizimda qayd etildi"
        case .preparing: return "Oshpazlarimiz taomni tayyorlamoqda"
        case .onTheWay: return "Kuryer issiq holda siz tomon yo'lda"
        case .delivered: return "Buyurtma yetkazildi. Yoqimli ishtaha!"
        case .cancelled: return "Buyurtma bekor qilingan"
        }
    }

    public var iconName: String {
        switch self {
        case .pending: return "clock.fill"
        case .preparing: return "flame.fill"
        case .onTheWay: return "bicycle"
        case .delivered: return "checkmark.seal.fill"
        case .cancelled: return "xmark.circle.fill"
        }
    }
}

// MARK: - Order Item
public struct OrderItem: Identifiable, Codable, Hashable {
    public let id: Int?
    public let productId: Int
    public let productName: String
    public let price: Double
    public let quantity: Int
    public let totalPrice: Double
    public let imageUrl: String?

    public var formattedPrice: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.groupingSeparator = " "
        let formatted = formatter.string(from: NSNumber(value: totalPrice)) ?? "\(Int(totalPrice))"
        return "\(formatted) so'm"
    }

    public var resolvedImageURL: URL? {
        guard let imageUrl else { return nil }
        return FeedUpAPIService.shared.resolveMediaURL(from: imageUrl)
    }

    enum CodingKeys: String, CodingKey {
        case id, price, quantity
        case productId = "product_id"
        case productName = "product_name"
        case totalPrice = "total_price"
        case imageUrl = "image_url"
    }
}

// MARK: - Order Model
public struct Order: Identifiable, Codable {
    public let id: Int
    public let orderNumber: String
    public let customerName: String
    public let customerPhone: String
    public let customerAddress: String
    public let branchId: Int?
    public let branchName: String?
    public let branchPhone: String?
    public let status: OrderStatus
    public let totalPrice: Double
    public let deliveryFee: Double
    public let paymentMethod: String
    public let prepTimeMin: Int
    public let estimatedReadyAt: String?
    public let notes: String?
    public let createdAt: String
    public let items: [OrderItem]?

    public var formattedTotal: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.groupingSeparator = " "
        let formatted = formatter.string(from: NSNumber(value: totalPrice)) ?? "\(Int(totalPrice))"
        return "\(formatted) so'm"
    }

    enum CodingKeys: String, CodingKey {
        case id, status, notes
        case orderNumber = "order_number"
        case customerName = "customer_name"
        case customerPhone = "customer_phone"
        case customerAddress = "customer_address"
        case branchId = "branch_id"
        case branchName = "branch_name"
        case branchPhone = "branch_phone"
        case totalPrice = "total_price"
        case deliveryFee = "delivery_fee"
        case paymentMethod = "payment_method"
        case prepTimeMin = "prep_time_min"
        case estimatedReadyAt = "estimated_ready_at"
        case createdAt = "created_at"
        case items
    }
}

// MARK: - Branch Model
public struct Branch: Identifiable, Codable, Hashable {
    public let id: Int
    public let name: String
    public let address: String
    public let phone: String
    public let openingHours: String?
    public let latitude: Double?
    public let longitude: Double?
    public let isActive: Int

    public var isOpen: Bool {
        isActive == 1
    }

    enum CodingKeys: String, CodingKey {
        case id, name, address, phone, latitude, longitude
        case openingHours = "opening_hours"
        case isActive = "is_active"
    }
}

// MARK: - Generic API Response Wrappers
public struct APIResponse<T: Decodable>: Decodable {
    public let success: Bool
    public let message: String?
    public let count: Int?
    public let data: T
}

public struct APIErrorResponse: Decodable {
    public let success: Bool?
    public let error: String
}

public struct DeleteResponse: Decodable {
    public let success: Bool
    public let message: String
    public let id: String
}

public struct BulkDeleteResponse: Decodable {
    public let success: Bool
    public let message: String
    public let count: Int
    public let deletedIds: [Int]
}

public struct ToggleAvailabilityResponse: Decodable {
    public let success: Bool
    public let message: String
    public let isAvailable: Int

    enum CodingKeys: String, CodingKey {
        case success, message
        case isAvailable = "is_available"
    }
}

public struct UploadResponse: Decodable {
    public let success: Bool
    public let message: String
    public let url: String
    public let fullUrl: String
    public let filename: String
    public let size: Int
    public let mimetype: String
}

public struct HealthResponse: Decodable {
    public let status: String
    public let timestamp: String
    public let service: String
    public let version: String
}

// MARK: - Stats & Shift Report Models
public struct StatusBreakdown: Codable {
    public let pending: Int
    public let preparing: Int
    public let onTheWay: Int
    public let delivered: Int
    public let cancelled: Int

    enum CodingKeys: String, CodingKey {
        case pending, preparing, delivered, cancelled
        case onTheWay = "on_the_way"
    }
}

public struct TopProductStat: Codable, Hashable {
    public let productName: String
    public let totalSold: Int
    public let totalRevenue: Double

    enum CodingKeys: String, CodingKey {
        case productName = "product_name"
        case totalSold = "total_sold"
        case totalRevenue = "total_revenue"
    }
}

public struct StatsData: Codable {
    public let totalOrders: Int
    public let totalRevenue: Double
    public let activeOrders: Int
    public let statusBreakdown: StatusBreakdown
    public let topProducts: [TopProductStat]
    public let totalProducts: Int
    public let totalBranches: Int
}

public struct ShiftSummary: Codable {
    public let totalOrders: Int
    public let deliveredRevenue: Double
    public let netRevenue: Double
    public let avgCheck: Double
    public let avgPrepTime: Double
    public let deliveredCount: Int
    public let cancelledCount: Int

    enum CodingKeys: String, CodingKey {
        case totalOrders = "total_orders"
        case deliveredRevenue = "delivered_revenue"
        case netRevenue = "net_revenue"
        case avgCheck = "avg_check"
        case avgPrepTime = "avg_prep_time"
        case deliveredCount = "delivered_count"
        case cancelledCount = "cancelled_count"
    }
}

public struct PaymentBreakdownStat: Codable {
    public let paymentMethod: String
    public let orderCount: Int
    public let totalAmount: Double

    enum CodingKeys: String, CodingKey {
        case paymentMethod = "payment_method"
        case orderCount = "order_count"
        case totalAmount = "total_amount"
    }
}

public struct BranchBreakdownStat: Codable {
    public let branchName: String
    public let ordersCount: Int
    public let totalRevenue: Double

    enum CodingKeys: String, CodingKey {
        case branchName = "branch_name"
        case ordersCount = "orders_count"
        case totalRevenue = "total_revenue"
    }
}

public struct ShiftReportData: Codable {
    public let timestamp: String
    public let summary: ShiftSummary
    public let paymentBreakdown: [PaymentBreakdownStat]
    public let branchBreakdown: [BranchBreakdownStat]
}

// MARK: - Request Payloads
public struct CategoryRequest: Encodable {
    public let name: String
    public let slug: String?
    public let icon: String?
    public let sortOrder: Int?

    public init(name: String, slug: String? = nil, icon: String? = nil, sortOrder: Int? = nil) {
        self.name = name
        self.slug = slug
        self.icon = icon
        self.sortOrder = sortOrder
    }

    enum CodingKeys: String, CodingKey {
        case name, slug, icon
        case sortOrder = "sort_order"
    }
}

public struct ProductRequest: Encodable {
    public let categoryId: Int
    public let name: String
    public let description: String?
    public let price: Double
    public let oldPrice: Double?
    public let calories: Int?
    public let prepTimeMin: Int?
    public let imageUrl: String?
    public let isAvailable: Int?

    public init(
        categoryId: Int,
        name: String,
        description: String? = nil,
        price: Double,
        oldPrice: Double? = nil,
        calories: Int? = nil,
        prepTimeMin: Int? = nil,
        imageUrl: String? = nil,
        isAvailable: Int? = 1
    ) {
        self.categoryId = categoryId
        self.name = name
        self.description = description
        self.price = price
        self.oldPrice = oldPrice
        self.calories = calories
        self.prepTimeMin = prepTimeMin
        self.imageUrl = imageUrl
        self.isAvailable = isAvailable
    }

    enum CodingKeys: String, CodingKey {
        case name, description, price, calories
        case categoryId = "category_id"
        case oldPrice = "old_price"
        case prepTimeMin = "prep_time_min"
        case imageUrl = "image_url"
        case isAvailable = "is_available"
    }
}

public struct CreateOrderItemPayload: Encodable {
    public let productId: Int
    public let quantity: Int

    public init(productId: Int, quantity: Int) {
        self.productId = productId
        self.quantity = quantity
    }

    enum CodingKeys: String, CodingKey {
        case productId = "product_id"
        case quantity
    }
}

public struct CreateOrderRequest: Encodable {
    public let customerName: String
    public let customerPhone: String
    public let customerAddress: String
    public let branchId: Int?
    public let paymentMethod: String
    public let notes: String
    public let items: [CreateOrderItemPayload]

    public init(
        customerName: String,
        customerPhone: String,
        customerAddress: String,
        branchId: Int? = nil,
        paymentMethod: String = "payme",
        notes: String = "",
        items: [CreateOrderItemPayload]
    ) {
        self.customerName = customerName
        self.customerPhone = customerPhone
        self.customerAddress = customerAddress
        self.branchId = branchId
        self.paymentMethod = paymentMethod
        self.notes = notes
        self.items = items
    }

    enum CodingKeys: String, CodingKey {
        case notes, items
        case customerName = "customer_name"
        case customerPhone = "customer_phone"
        case customerAddress = "customer_address"
        case branchId = "branch_id"
        case paymentMethod = "payment_method"
    }
}

public struct BranchRequest: Encodable {
    public let name: String
    public let address: String
    public let phone: String
    public let latitude: Double?
    public let longitude: Double?
    public let openingHours: String?
    public let isActive: Int?

    public init(
        name: String,
        address: String,
        phone: String,
        latitude: Double? = nil,
        longitude: Double? = nil,
        openingHours: String? = "09:00 - 03:00",
        isActive: Int? = 1
    ) {
        self.name = name
        self.address = address
        self.phone = phone
        self.latitude = latitude
        self.longitude = longitude
        self.openingHours = openingHours
        self.isActive = isActive
    }

    enum CodingKeys: String, CodingKey {
        case name, address, phone, latitude, longitude
        case openingHours = "opening_hours"
        case isActive = "is_active"
    }
}


