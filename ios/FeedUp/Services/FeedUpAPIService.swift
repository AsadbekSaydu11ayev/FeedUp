//
//  FeedUpAPIService.swift
//  FeedUp iOS App
//

import Foundation

public final class FeedUpAPIService {
    public static let shared = FeedUpAPIService()

    // Live Render production/demo URL (use "http://localhost:5001/api" for local development)
    public var baseURL = "https://feedup-eyei.onrender.com/api"

    /// Root server origin without `/api` suffix (e.g. "http://localhost:5001")
    public var serverOrigin: String {
        baseURL.hasSuffix("/api") ? String(baseURL.dropLast(4)) : baseURL
    }

    public func resolveMediaURL(from pathOrURL: String) -> URL? {
        let trimmed = pathOrURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        if trimmed.lowercased().hasPrefix("http://") || trimmed.lowercased().hasPrefix("https://") {
            return URL(string: trimmed)
        }
        let normalizedPath = trimmed.hasPrefix("/") ? trimmed : "/\(trimmed)"
        return URL(string: serverOrigin + normalizedPath)
    }

    public func downloadImageData(from pathOrURL: String) async throws -> Data {
        guard let url = resolveMediaURL(from: pathOrURL) else {
            throw APIError.invalidURL
        }
        let (data, response) = try await session.data(from: url)
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.serverError(
                statusCode: (response as? HTTPURLResponse)?.statusCode ?? 0,
                message: "Rasmni yuklab olishda xatolik."
            )
        }
        return data
    }

    private let session: URLSession
    private let decoder: JSONDecoder

    private init(session: URLSession = .shared) {
        self.session = session
        self.decoder = JSONDecoder()
    }

    // MARK: - Generic Request Executor
    public func request<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T {
        let urlRequest = try endpoint.asURLRequest(baseURL: baseURL)

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.serverError(statusCode: 0, message: "Noto'g'ri server javobi.")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            if let apiError = try? decoder.decode(APIErrorResponse.self, from: data) {
                throw APIError.serverError(statusCode: httpResponse.statusCode, message: apiError.error)
            }
            throw APIError.serverError(
                statusCode: httpResponse.statusCode,
                message: HTTPURLResponse.localizedString(forStatusCode: httpResponse.statusCode)
            )
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    // MARK: - Categories
    public func getCategories() async throws -> [Category] {
        let res: APIResponse<[Category]> = try await request(.getCategories)
        return res.data
    }

    public func getCategory(id: Int) async throws -> Category {
        let res: APIResponse<Category> = try await request(.getCategory(id: id))
        return res.data
    }

    public func createCategory(_ payload: CategoryRequest) async throws -> Category {
        let res: APIResponse<Category> = try await request(.createCategory(payload))
        return res.data
    }

    public func updateCategory(id: Int, payload: CategoryRequest) async throws -> Category {
        let res: APIResponse<Category> = try await request(.updateCategory(id: id, payload: payload))
        return res.data
    }

    public func deleteCategory(id: Int) async throws -> DeleteResponse {
        try await request(.deleteCategory(id: id))
    }

    // MARK: - Products
    public func getProducts(categoryId: Int? = nil, isAvailable: Bool? = nil, search: String? = nil) async throws -> [Product] {
        let res: APIResponse<[Product]> = try await request(
            .getProducts(categoryId: categoryId, isAvailable: isAvailable, search: search)
        )
        return res.data
    }

    public func getProduct(id: Int) async throws -> Product {
        let res: APIResponse<Product> = try await request(.getProduct(id: id))
        return res.data
    }

    public func createProduct(_ payload: ProductRequest) async throws -> Product {
        let res: APIResponse<Product> = try await request(.createProduct(payload))
        return res.data
    }

    public func updateProduct(id: Int, payload: ProductRequest) async throws -> Product {
        let res: APIResponse<Product> = try await request(.updateProduct(id: id, payload: payload))
        return res.data
    }

    public func toggleProductAvailability(id: Int) async throws -> ToggleAvailabilityResponse {
        try await request(.toggleProductAvailability(id: id))
    }

    public func deleteProduct(id: Int) async throws -> DeleteResponse {
        try await request(.deleteProduct(id: id))
    }

    public func bulkDeleteProducts(ids: [Int]) async throws -> BulkDeleteResponse {
        try await request(.bulkDeleteProducts(ids: ids))
    }

    // MARK: - Image Upload
    public func uploadImage(imageData: Data, fileName: String = "image.jpg", mimeType: String = "image/jpeg") async throws -> UploadResponse {
        try await request(.uploadImage(imageData: imageData, fileName: fileName, mimeType: mimeType))
    }

    // MARK: - Branches
    public func getBranches(isActive: Bool? = nil) async throws -> [Branch] {
        let res: APIResponse<[Branch]> = try await request(.getBranches(isActive: isActive))
        return res.data
    }

    public func getBranch(id: Int) async throws -> Branch {
        let res: APIResponse<Branch> = try await request(.getBranch(id: id))
        return res.data
    }

    public func createBranch(_ payload: BranchRequest) async throws -> Branch {
        let res: APIResponse<Branch> = try await request(.createBranch(payload))
        return res.data
    }

    public func updateBranch(id: Int, payload: BranchRequest) async throws -> Branch {
        let res: APIResponse<Branch> = try await request(.updateBranch(id: id, payload: payload))
        return res.data
    }

    public func deleteBranch(id: Int) async throws -> DeleteResponse {
        try await request(.deleteBranch(id: id))
    }

    // MARK: - Orders
    public func getOrders(status: OrderStatus? = nil, branchId: Int? = nil, search: String? = nil) async throws -> [Order] {
        let res: APIResponse<[Order]> = try await request(
            .getOrders(status: status, branchId: branchId, search: search)
        )
        return res.data
    }

    public func createOrder(
        customerName: String,
        phone: String,
        address: String,
        branchId: Int? = nil,
        paymentMethod: String = "payme",
        notes: String = "",
        cartItems: [(productId: Int, quantity: Int)]
    ) async throws -> Order {
        let payload = CreateOrderRequest(
            customerName: customerName,
            customerPhone: phone,
            customerAddress: address,
            branchId: branchId,
            paymentMethod: paymentMethod,
            notes: notes,
            items: cartItems.map { CreateOrderItemPayload(productId: $0.productId, quantity: $0.quantity) }
        )
        let res: APIResponse<Order> = try await request(.createOrder(payload))
        return res.data
    }

    public func trackOrder(orderNumberOrId: String) async throws -> Order {
        let res: APIResponse<Order> = try await request(.getOrder(idOrNumber: orderNumberOrId))
        return res.data
    }

    public func updateOrderStatus(id: Int, status: OrderStatus) async throws -> Order {
        let res: APIResponse<Order> = try await request(.updateOrderStatus(id: id, status: status))
        return res.data
    }

    public func updateOrderPrepTime(id: Int, minutes: Int) async throws -> Order {
        let res: APIResponse<Order> = try await request(.updateOrderPrepTime(id: id, minutes: minutes))
        return res.data
    }

    public func deleteOrder(id: Int) async throws -> DeleteResponse {
        try await request(.deleteOrder(id: id))
    }

    // MARK: - Stats & Health
    public func getStats() async throws -> StatsData {
        let res: APIResponse<StatsData> = try await request(.getStats)
        return res.data
    }

    public func getShiftReport() async throws -> ShiftReportData {
        let res: APIResponse<ShiftReportData> = try await request(.getShiftReport)
        return res.data
    }

    public func checkHealth() async throws -> HealthResponse {
        try await request(.health)
    }
}
