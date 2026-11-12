//
//  APIEndpoint.swift
//  FeedUp iOS App
//

import Foundation

// MARK: - HTTP Method
public enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

// MARK: - API Error
public enum APIError: LocalizedError {
    case invalidURL
    case serverError(statusCode: Int, message: String)
    case decodingError(Error)
    case networkError(Error)

    public var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Noto'g'ri URL manzili."
        case .serverError(let statusCode, let message):
            return "Server xatoligi (\(statusCode)): \(message)"
        case .decodingError(let error):
            return "Ma'lumotni o'qishda xatolik: \(error.localizedDescription)"
        case .networkError(let error):
            return "Tarmoq xatoligi: \(error.localizedDescription)"
        }
    }
}

// MARK: - APIEndpoint Router
public enum APIEndpoint {
    // 1. Categories
    case getCategories
    case getCategory(id: Int)
    case createCategory(CategoryRequest)
    case updateCategory(id: Int, payload: CategoryRequest)
    case deleteCategory(id: Int)

    // 2. Products
    case getProducts(categoryId: Int? = nil, isAvailable: Bool? = nil, search: String? = nil)
    case getProduct(id: Int)
    case createProduct(ProductRequest)
    case updateProduct(id: Int, payload: ProductRequest)
    case toggleProductAvailability(id: Int)
    case deleteProduct(id: Int)
    case bulkDeleteProducts(ids: [Int])

    // 3. Image Upload & Download
    case uploadImage(imageData: Data, fileName: String = "image.jpg", mimeType: String = "image/jpeg")
    case downloadImage(filename: String)

    // 4. Orders & SSE Stream
    case getOrders(status: OrderStatus? = nil, branchId: Int? = nil, search: String? = nil)
    case getOrder(idOrNumber: String)
    case createOrder(CreateOrderRequest)
    case updateOrderStatus(id: Int, status: OrderStatus)
    case updateOrderPrepTime(id: Int, minutes: Int)
    case deleteOrder(id: Int)
    case ordersStream

    // 5. Branches
    case getBranches(isActive: Bool? = nil)
    case getBranch(id: Int)
    case createBranch(BranchRequest)
    case updateBranch(id: Int, payload: BranchRequest)
    case deleteBranch(id: Int)

    // 6. Stats & System
    case getStats
    case getShiftReport
    case health
    case endpointsCatalog

    // MARK: - Path (Relative to baseURL, e.g. http://localhost:5001/api)
    public var path: String {
        switch self {
        case .getCategories, .createCategory:
            return "/categories"
        case .getCategory(let id), .updateCategory(let id, _), .deleteCategory(let id):
            return "/categories/\(id)"

        case .getProducts, .createProduct:
            return "/products"
        case .getProduct(let id), .updateProduct(let id, _), .deleteProduct(let id):
            return "/products/\(id)"
        case .toggleProductAvailability(let id):
            return "/products/\(id)/toggle-availability"
        case .bulkDeleteProducts:
            return "/products/bulk-delete"

        case .uploadImage:
            return "/upload"
        case .downloadImage(let filename):
            return "/upload/\(filename)"

        case .getOrders, .createOrder:
            return "/orders"
        case .getOrder(let idOrNumber):
            return "/orders/\(idOrNumber)"
        case .updateOrderStatus(let id, _):
            return "/orders/\(id)/status"
        case .updateOrderPrepTime(let id, _):
            return "/orders/\(id)/prep-time"
        case .deleteOrder(let id):
            return "/orders/\(id)"
        case .ordersStream:
            return "/orders/stream"

        case .getBranches, .createBranch:
            return "/branches"
        case .getBranch(let id), .updateBranch(let id, _), .deleteBranch(let id):
            return "/branches/\(id)"

        case .getStats:
            return "/stats"
        case .getShiftReport:
            return "/stats/shift-report"
        case .health:
            return "/health"
        case .endpointsCatalog:
            return "/endpoints"
        }
    }

    // MARK: - HTTP Method
    public var method: HTTPMethod {
        switch self {
        case .getCategories, .getCategory,
             .getProducts, .getProduct, .downloadImage,
             .getOrders, .getOrder, .ordersStream,
             .getBranches, .getBranch,
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

    // MARK: - Query Parameters
    public var queryItems: [URLQueryItem]? {
        var items: [URLQueryItem] = []

        switch self {
        case .getProducts(let categoryId, let isAvailable, let search):
            if let categoryId {
                items.append(URLQueryItem(name: "category_id", value: "\(categoryId)"))
            }
            if let isAvailable {
                items.append(URLQueryItem(name: "is_available", value: isAvailable ? "1" : "0"))
            }
            if let search, !search.trimmingCharacters(in: .whitespaces).isEmpty {
                items.append(URLQueryItem(name: "search", value: search))
            }

        case .getOrders(let status, let branchId, let search):
            if let status {
                items.append(URLQueryItem(name: "status", value: status.rawValue))
            }
            if let branchId {
                items.append(URLQueryItem(name: "branch_id", value: "\(branchId)"))
            }
            if let search, !search.trimmingCharacters(in: .whitespaces).isEmpty {
                items.append(URLQueryItem(name: "search", value: search))
            }

        case .getBranches(let isActive):
            if let isActive {
                items.append(URLQueryItem(name: "is_active", value: isActive ? "1" : "0"))
            }

        default:
            break
        }

        return items.isEmpty ? nil : items
    }

    // MARK: - Build URLRequest
    public func asURLRequest(baseURL: String) throws -> URLRequest {
        guard var components = URLComponents(string: baseURL + path) else {
            throw APIError.invalidURL
        }
        if let queryItems {
            components.queryItems = queryItems
        }
        guard let finalURL = components.url else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: finalURL)
        request.httpMethod = method.rawValue
        request.setValue("true", forHTTPHeaderField: "ngrok-skip-browser-warning")

        switch self {
        case .uploadImage(let imageData, let fileName, let mimeType):
            let boundary = "Boundary-\(UUID().uuidString)"
            request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
            request.httpBody = buildMultipartBody(
                fieldName: "image",
                fileName: fileName,
                mimeType: mimeType,
                fileData: imageData,
                boundary: boundary
            )

        case .createCategory(let payload), .updateCategory(_, let payload):
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(payload)

        case .createProduct(let payload), .updateProduct(_, let payload):
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(payload)

        case .bulkDeleteProducts(let ids):
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: ["ids": ids])

        case .createOrder(let payload):
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(payload)

        case .updateOrderStatus(_, let status):
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: ["status": status.rawValue])

        case .updateOrderPrepTime(_, let minutes):
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: ["prep_time_min": minutes])

        case .createBranch(let payload), .updateBranch(_, let payload):
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(payload)

        case .ordersStream:
            request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
            request.timeoutInterval = .infinity

        default:
            request.setValue("application/json", forHTTPHeaderField: "Accept")
        }

        return request
    }

    private func buildMultipartBody(
        fieldName: String,
        fileName: String,
        mimeType: String,
        fileData: Data,
        boundary: String
    ) -> Data {
        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"\(fieldName)\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        return body
    }
}

