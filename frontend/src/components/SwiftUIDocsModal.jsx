import React, { useState } from 'react';
import { X, Copy, Check, Code, Smartphone, Database, Globe } from 'lucide-react';

export default function SwiftUIDocsModal({ isOpen, onClose }) {
  const [activeCodeTab, setActiveCodeTab] = useState('endpoint');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const swiftAPIEndpointCode = `//
//  APIEndpoint.swift
//  FeedUp iOS App
//

import Foundation

public enum HTTPMethod: String {
    case get = "GET", post = "POST", put = "PUT", patch = "PATCH", delete = "DELETE"
}

public enum APIEndpoint {
    // Categories
    case getCategories
    case getCategory(id: Int)
    case createCategory(CategoryRequest)
    case updateCategory(id: Int, payload: CategoryRequest)
    case deleteCategory(id: Int)

    // Products
    case getProducts(categoryId: Int? = nil, isAvailable: Bool? = nil, search: String? = nil)
    case getProduct(id: Int)
    case createProduct(ProductRequest)
    case updateProduct(id: Int, payload: ProductRequest)
    case toggleProductAvailability(id: Int)
    case deleteProduct(id: Int)
    case bulkDeleteProducts(ids: [Int])

    // Upload
    case uploadImage(imageData: Data, fileName: String = "image.jpg", mimeType: String = "image/jpeg")

    // Orders & SSE Stream
    case getOrders(status: OrderStatus? = nil, branchId: Int? = nil, search: String? = nil)
    case getOrder(idOrNumber: String)
    case createOrder(CreateOrderRequest)
    case updateOrderStatus(id: Int, status: OrderStatus)
    case updateOrderPrepTime(id: Int, minutes: Int)
    case deleteOrder(id: Int)
    case ordersStream

    // Branches
    case getBranches(isActive: Bool? = nil)
    case getBranch(id: Int)
    case createBranch(BranchRequest)
    case updateBranch(id: Int, payload: BranchRequest)
    case deleteBranch(id: Int)

    // Stats & System
    case getStats
    case getShiftReport
    case health
    case endpointsCatalog

    public var path: String {
        switch self {
        case .getCategories, .createCategory: return "/categories"
        case .getCategory(let id), .updateCategory(let id, _), .deleteCategory(let id): return "/categories/\\(id)"
        case .getProducts, .createProduct: return "/products"
        case .getProduct(let id), .updateProduct(let id, _), .deleteProduct(let id): return "/products/\\(id)"
        case .toggleProductAvailability(let id): return "/products/\\(id)/toggle-availability"
        case .bulkDeleteProducts: return "/products/bulk-delete"
        case .uploadImage: return "/upload"
        case .getOrders, .createOrder: return "/orders"
        case .getOrder(let idOrNumber): return "/orders/\\(idOrNumber)"
        case .updateOrderStatus(let id, _): return "/orders/\\(id)/status"
        case .updateOrderPrepTime(let id, _): return "/orders/\\(id)/prep-time"
        case .deleteOrder(let id): return "/orders/\\(id)"
        case .ordersStream: return "/orders/stream"
        case .getBranches, .createBranch: return "/branches"
        case .getBranch(let id), .updateBranch(let id, _), .deleteBranch(let id): return "/branches/\\(id)"
        case .getStats: return "/stats"
        case .getShiftReport: return "/stats/shift-report"
        case .health: return "/health"
        case .endpointsCatalog: return "/endpoints"
        }
    }

    public var method: HTTPMethod {
        switch self {
        case .getCategories, .getCategory, .getProducts, .getProduct,
             .getOrders, .getOrder, .ordersStream, .getBranches, .getBranch,
             .getStats, .getShiftReport, .health, .endpointsCatalog:
            return .get
        case .createCategory, .createProduct, .bulkDeleteProducts,
             .uploadImage, .createOrder, .createBranch:
            return .post
        case .updateCategory, .updateProduct, .updateBranch:
            return .put
        case .toggleProductAvailability, .updateOrderStatus, .updateOrderPrepTime:
            return .patch
        case .deleteCategory, .deleteProduct, .deleteOrder, .deleteBranch:
            return .delete
        }
    }

    public func asURLRequest(baseURL: String) throws -> URLRequest {
        var components = URLComponents(string: baseURL + path)!
        // Query items & JSON/Multipart body (to'liq kodi: ios/FeedUp/Services/APIEndpoint.swift)
        var request = URLRequest(url: components.url!)
        request.httpMethod = method.rawValue
        return request
    }
}
`;

  const swiftModelsCode = `//
//  FeedUpModels.swift
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
    public let name: String
    public let description: String?
    public let price: Double
    public let oldPrice: Double?
    public let calories: Int
    public let prepTimeMin: Int
    public let imageUrl: String
    public let isAvailable: Int

    public var available: Bool {
        isAvailable == 1
    }

    public var hasDiscount: Bool {
        guard let oldPrice = oldPrice else { return false }
        return oldPrice > price
    }

    public var formattedPrice: String {
        Self.formatCurrency(price)
    }

    public var formattedOldPrice: String? {
        guard let oldPrice = oldPrice else { return nil }
        return Self.formatCurrency(oldPrice)
    }

    private static func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.groupingSeparator = " "
        let formatted = formatter.string(from: NSNumber(value: amount)) ?? "\\(Int(amount))"
        return "\\(formatted) so'm"
    }

    enum CodingKeys: String, CodingKey {
        case id, name, description, price, calories
        case categoryId = "category_id"
        case categoryName = "category_name"
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
    public let status: OrderStatus
    public let totalPrice: Double
    public let deliveryFee: Double
    public let paymentMethod: String
    public let prepTimeMin: Int
    public let estimatedReadyAt: String?
    public let notes: String?
    public let createdAt: String
    public let items: [OrderItem]?

    enum CodingKeys: String, CodingKey {
        case id, status, notes
        case orderNumber = "order_number"
        case customerName = "customer_name"
        case customerPhone = "customer_phone"
        case customerAddress = "customer_address"
        case branchId = "branch_id"
        case totalPrice = "total_price"
        case deliveryFee = "delivery_fee"
        case paymentMethod = "payment_method"
        case prepTimeMin = "prep_time_min"
        case estimatedReadyAt = "estimated_ready_at"
        case createdAt = "created_at"
        case items
    }
}
`;

  const swiftAPIServiceCode = `//
//  FeedUpAPIService.swift
//  FeedUp iOS App
//

import Foundation

public final class FeedUpAPIService {
    public static let shared = FeedUpAPIService()
    
    // Set to your Mac/Server IP or local tunnel when testing on physical iPhone
    public var baseURL = "http://localhost:5001/api"
    
    private init() {}
    
    // MARK: - Fetch Categories
    public func getCategories() async throws -> [Category] {
        guard let url = URL(string: "\\(baseURL)/categories") else {
            throw URLError(.badURL)
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        
        struct Response: Decodable {
            let success: Bool
            let data: [Category]
        }
        
        let decoded = try JSONDecoder().decode(Response.self, from: data)
        return decoded.data
    }
    
    // MARK: - Fetch Products
    public func getProducts(categoryId: Int? = nil) async throws -> [Product] {
        var components = URLComponents(string: "\\(baseURL)/products")!
        if let catId = categoryId {
            components.queryItems = [URLQueryItem(name: "category_id", value: "\\(catId)")]
        }
        
        let (data, response) = try await URLSession.shared.data(from: components.url!)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        
        struct Response: Decodable {
            let success: Bool
            let data: [Product]
        }
        
        let decoded = try JSONDecoder().decode(Response.self, from: data)
        return decoded.data
    }
    
    // MARK: - Create Order
    public func createOrder(
        customerName: String,
        phone: String,
        address: String,
        branchId: Int? = nil,
        paymentMethod: String = "payme",
        notes: String = "",
        cartItems: [(productId: Int, quantity: Int)]
    ) async throws -> Order {
        guard let url = URL(string: "\\(baseURL)/orders") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let payload: [String: Any] = [
            "customer_name": customerName,
            "customer_phone": phone,
            "customer_address": address,
            "branch_id": branchId as Any,
            "payment_method": paymentMethod,
            "notes": notes,
            "items": cartItems.map { ["product_id": $0.productId, "quantity": $0.quantity] }
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, (200...201).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
        
        struct Response: Decodable {
            let success: Bool
            let data: Order
        }
        
        let decoded = try JSONDecoder().decode(Response.self, from: data)
        return decoded.data
    }
    
    // MARK: - Track Order by Number or ID
    public func trackOrder(orderNumberOrId: String) async throws -> Order {
        guard let url = URL(string: "\\(baseURL)/orders/\\(orderNumberOrId)") else {
            throw URLError(.badURL)
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        struct Response: Decodable {
            let success: Bool
            let data: Order
        }
        let decoded = try JSONDecoder().decode(Response.self, from: data)
        return decoded.data
    }
}
`;

  const swiftUIViewCode = `//
//  OrderTrackingView.swift
//  FeedUp iOS App
//

import SwiftUI

public struct OrderTrackingView: View {
    @State public var order: Order
    @State private var timerText: String = ""
    @State private var isRefreshing: Bool = false
    
    public init(order: Order) {
        _order = State(initialValue: order)
    }
    
    public var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Order Header
                VStack(spacing: 6) {
                    Text("Buyurtma #\\(order.orderNumber)")
                        .font(.title2.bold())
                        .foregroundColor(Color(red: 0.89, green: 0.12, blue: 0.14))
                    
                    Text("Jonli monitoring")
                        .font(.caption)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Color.red.opacity(0.1))
                        .foregroundColor(.red)
                        .clipShape(Capsule())
                }
                .padding(.top)
                
                // Stepper Card
                VStack(alignment: .leading, spacing: 20) {
                    StatusRow(
                        title: "Buyurtma qabul qilindi",
                        subtitle: "Tizimda muvaffaqiyatli qayd etildi",
                        isCompleted: true,
                        isCurrent: order.status == .pending
                    )
                    
                    StatusRow(
                        title: "Oshxonada tayyorlanmoqda",
                        subtitle: "Oshpazlarimiz taomni tayyorlamoqda",
                        isCompleted: [.preparing, .onTheWay, .delivered].contains(order.status),
                        isCurrent: order.status == .preparing
                    )
                    
                    StatusRow(
                        title: "Kuryer yo'lda",
                        subtitle: "Issiq holda yetkazilmoqda",
                        isCompleted: [.onTheWay, .delivered].contains(order.status),
                        isCurrent: order.status == .onTheWay
                    )
                    
                    StatusRow(
                        title: "Yetkazib berildi",
                        subtitle: "Yoqimli ishtaha tilaymiz!",
                        isCompleted: order.status == .delivered,
                        isCurrent: order.status == .delivered
                    )
                }
                .padding(20)
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 4)
                
                // Total Amount
                HStack {
                    Text("Jami to'lov:")
                        .font(.headline)
                    Spacer()
                    Text("\\(Int(order.totalPrice)) so'm")
                        .font(.title3.bold())
                        .foregroundColor(Color(red: 0.89, green: 0.12, blue: 0.14))
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
            }
            .padding()
        }
        .navigationTitle("Buyurtma Holati")
        .refreshable {
            await refreshOrder()
        }
    }
    
    private func refreshOrder() async {
        do {
            let updated = try await FeedUpAPIService.shared.trackOrder(orderNumberOrId: order.orderNumber)
            await MainActor.run {
                self.order = updated
            }
        } catch {
            print("Refresh failed: \\(error)")
        }
    }
}

// Helper Step Row
struct StatusRow: View {
    let title: String
    let subtitle: String
    let isCompleted: Bool
    let isCurrent: Bool
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(isCompleted ? Color(red: 0.89, green: 0.12, blue: 0.14) : Color.gray.opacity(0.3))
                    .frame(width: 32, height: 32)
                
                if isCompleted {
                    Image(systemName: "checkmark")
                        .font(.caption.bold())
                        .foregroundColor(.white)
                }
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.bold())
                    .foregroundColor(isCompleted ? .primary : .secondary)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
    }
}
`;

  const getActiveCode = () => {
    switch (activeCodeTab) {
      case 'endpoint': return swiftAPIEndpointCode;
      case 'models': return swiftModelsCode;
      case 'service': return swiftAPIServiceCode;
      case 'views': return swiftUIViewCode;
      default: return swiftAPIEndpointCode;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                iOS SwiftUI Integratsiya Qo'llanmasi & Kodlari
              </h2>
              <p className="text-xs text-gray-500">
                FeedUp mobil ilovasi uchun tayyor Swift kodlari va arxitekturasi
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Code tabs */}
        <div className="flex items-center justify-between px-6 pt-4 border-b border-gray-100 bg-white">
          <div className="flex space-x-2 overflow-x-auto">
            {[
              { id: 'endpoint', label: 'APIEndpoint.swift (Router)' },
              { id: 'models', label: 'Models.swift (Codable)' },
              { id: 'service', label: 'FeedUpAPIService.swift (async/await)' },
              { id: 'views', label: 'OrderTrackingView.swift (SwiftUI)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCodeTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer ${
                  activeCodeTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Nusxa olindi!' : 'Kodni nusxalash'}</span>
          </button>
        </div>

        {/* Code View Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-950 font-mono text-xs text-gray-200 leading-relaxed selection:bg-red-900 selection:text-white">
          <pre>{getActiveCode()}</pre>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>REST API Base URL: <code className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-800">http://localhost:5001/api</code></span>
          <span>Swift 5.9+ / iOS 16+ moslashuvchan</span>
        </div>
      </div>
    </div>
  );
}

