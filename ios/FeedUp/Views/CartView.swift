//
//  CartView.swift
//  FeedUp iOS App
//

import SwiftUI

public struct CartView: View {
    @ObservedObject private var cart = CartManager.shared
    @Environment(\.dismiss) private var dismiss
    
    @State private var customerName = "Jasur Aliyev"
    @State private var customerPhone = "+998 90 123 45 67"
    @State private var customerAddress = "Chilonzor 7-mavze, 14-uy, 28-xonadon"
    @State private var paymentMethod = "payme"
    @State private var notes = "Eshik qo'ng'irog'i buzilgan"
    @State private var isSubmitting = false
    @State private var placedOrder: Order? = nil
    
    let feedUpRed = Color(red: 0.89, green: 0.12, blue: 0.14)
    
    public init() {}
    
    public var body: some View {
        NavigationStack {
            Group {
                if let order = placedOrder {
                    OrderTrackingView(order: order)
                } else if cart.items.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "cart")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        Text("Savatingiz bo'sh")
                            .font(.headline)
                        Text("Mazali taomlarimizni tanlang va buyurtma bering")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                } else {
                    Form {
                        Section("Taomlar") {
                            ForEach(cart.items) { item in
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(item.product.name)
                                            .font(.subheadline.bold())
                                        Text(item.product.formattedPrice)
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                    
                                    Spacer()
                                    
                                    HStack(spacing: 12) {
                                        Button("-") {
                                            cart.updateQuantity(productId: item.product.id, delta: -1)
                                        }
                                        .buttonStyle(.bordered)
                                        
                                        Text("\(item.quantity)")
                                            .font(.subheadline.bold())
                                        
                                        Button("+") {
                                            cart.updateQuantity(productId: item.product.id, delta: 1)
                                        }
                                        .buttonStyle(.borderedProminent)
                                        .tint(feedUpRed)
                                    }
                                }
                            }
                        }
                        
                        Section("Yetkazib berish ma'lumotlari") {
                            TextField("Ismingiz", text: $customerName)
                            TextField("Telefon raqamingiz", text: $customerPhone)
                                .keyboardType(.phonePad)
                            TextField("Yetkazish manzili", text: $customerAddress)
                            TextField("Izoh (ixtiyoriy)", text: $notes)
                        }
                        
                        Section("To'lov turi") {
                            Picker("To'lov turi", selection: $paymentMethod) {
                                Text("Payme").tag("payme")
                                Text("Click").tag("click")
                                Text("Naqd pul").tag("cash")
                            }
                            .pickerStyle(.segmented)
                        }
                        
                        Section("Hisob-kitob") {
                            HStack {
                                Text("Taomlar summasi:")
                                Spacer()
                                Text("\(Int(cart.subtotal)) so'm")
                            }
                            HStack {
                                Text("Yetkazib berish:")
                                Spacer()
                                Text("\(Int(cart.deliveryFee)) so'm")
                            }
                            HStack {
                                Text("Jami:")
                                    .font(.headline)
                                Spacer()
                                Text("\(Int(cart.total)) so'm")
                                    .font(.headline)
                                    .foregroundColor(feedUpRed)
                            }
                        }
                        
                        Section {
                            Button {
                                Task { await submitOrder() }
                            } label: {
                                HStack {
                                    Spacer()
                                    if isSubmitting {
                                        ProgressView()
                                    } else {
                                        Text("Buyurtmani tasdiqlash")
                                            .font(.headline.bold())
                                            .foregroundColor(.white)
                                    }
                                    Spacer()
                                }
                            }
                            .listRowBackground(feedUpRed)
                            .disabled(isSubmitting)
                        }
                    }
                }
            }
            .navigationTitle(placedOrder != nil ? "Buyurtma Holati" : "Savat")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Yopish") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func submitOrder() async {
        isSubmitting = true
        do {
            let items = cart.items.map { ($0.product.id, $0.quantity) }
            let order = try await FeedUpAPIService.shared.createOrder(
                customerName: customerName,
                phone: customerPhone,
                address: customerAddress,
                branchId: 1,
                paymentMethod: paymentMethod,
                notes: notes,
                cartItems: items
            )
            cart.clear()
            self.placedOrder = order
        } catch {
            print("Order submission failed: \(error)")
        }
        isSubmitting = false
    }
}

