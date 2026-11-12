//
//  MenuViewModel.swift
//  FeedUp iOS App
//

import Foundation
import Combine

@MainActor
public final class MenuViewModel: ObservableObject {
    @Published public var categories: [Category] = []
    @Published public var products: [Product] = []
    @Published public var selectedCategoryId: Int? = nil
    @Published public var searchQuery: String = ""
    @Published public var isLoading: Bool = false
    @Published public var errorMessage: String? = nil
    
    private let api = FeedUpAPIService.shared
    
    public init() {}
    
    public func loadData() async {
        isLoading = true
        errorMessage = nil
        
        do {
            async let fetchedCategories = api.getCategories()
            async let fetchedProducts = api.getProducts(categoryId: selectedCategoryId, search: searchQuery)
            
            let (cats, prods) = try await (fetchedCategories, fetchedProducts)
            self.categories = cats
            self.products = prods
        } catch {
            self.errorMessage = "Ma'lumotlarni yuklab bo'lmadi: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    public func selectCategory(_ id: Int?) async {
        self.selectedCategoryId = id
        await loadProductsOnly()
    }
    
    public func search() async {
        await loadProductsOnly()
    }
    
    private func loadProductsOnly() async {
        do {
            self.products = try await api.getProducts(categoryId: selectedCategoryId, search: searchQuery)
        } catch {
            print("Error loading products: \(error)")
        }
    }
}

