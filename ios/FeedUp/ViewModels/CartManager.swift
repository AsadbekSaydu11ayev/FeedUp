//
//  CartManager.swift
//  FeedUp iOS App
//

import Foundation
import Combine

public struct CartEntry: Identifiable, Hashable {
    public var id: Int { product.id }
    public let product: Product
    public var quantity: Int
}

@MainActor
public final class CartManager: ObservableObject {
    public static let shared = CartManager()
    
    @Published public var items: [CartEntry] = []
    public let deliveryFee: Double = 15000.0
    
    private init() {}
    
    public var totalItemCount: Int {
        items.reduce(0) { $0 + $1.quantity }
    }
    
    public var subtotal: Double {
        items.reduce(0) { $0 + ($1.product.price * Double($1.quantity)) }
    }
    
    public var total: Double {
        items.isEmpty ? 0 : (subtotal + deliveryFee)
    }
    
    public func add(product: Product) {
        if let idx = items.firstIndex(where: { $0.product.id == product.id }) {
            items[idx].quantity += 1
        } else {
            items.append(CartEntry(product: product, quantity: 1))
        }
    }
    
    public func updateQuantity(productId: Int, delta: Int) {
        guard let idx = items.firstIndex(where: { $0.product.id == productId }) else { return }
        let newQty = items[idx].quantity + delta
        if newQty > 0 {
            items[idx].quantity = newQty
        } else {
            items.remove(at: idx)
        }
    }
    
    public func clear() {
        items.removeAll()
    }
}

