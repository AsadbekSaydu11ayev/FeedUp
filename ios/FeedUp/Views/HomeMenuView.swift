//
//  HomeMenuView.swift
//  FeedUp iOS App
//

import SwiftUI

public struct HomeMenuView: View {
    @StateObject private var viewModel = MenuViewModel()
    @ObservedObject private var cart = CartManager.shared
    @State private var showingCart = false
    
    let feedUpRed = Color(red: 0.89, green: 0.12, blue: 0.14)
    
    public init() {}
    
    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // FeedUp Brand Banner
                    ZStack(alignment: .leading) {
                        LinearGradient(
                            colors: [feedUpRed, Color(red: 0.95, green: 0.25, blue: 0.15)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                        .cornerRadius(20)
                        
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text("FEEDUP")
                                    .font(.title2.bold())
                                    .foregroundColor(.white)
                                Text("FAST FOOD")
                                    .font(.caption.bold())
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 2)
                                    .background(Color.yellow)
                                    .foregroundColor(.black)
                                    .cornerRadius(6)
                            }
                            
                            Text("Tezkor yetkazib berish: 20-35 daqiqa")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.9))
                        }
                        .padding(20)
                    }
                    .padding(.horizontal)
                    
                    // Search Bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.gray)
                        TextField("Taom nomini qidirish...", text: $viewModel.searchQuery)
                            .onSubmit {
                                Task { await viewModel.search() }
                            }
                    }
                    .padding(12)
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    
                    // Category Filter Carousel
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            Button {
                                Task { await viewModel.selectCategory(nil) }
                            } label: {
                                Text("Barchasi")
                                    .font(.subheadline.bold())
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(viewModel.selectedCategoryId == nil ? feedUpRed : Color(.systemGray6))
                                    .foregroundColor(viewModel.selectedCategoryId == nil ? .white : .primary)
                                    .cornerRadius(20)
                            }
                            
                            ForEach(viewModel.categories) { cat in
                                Button {
                                    Task { await viewModel.selectCategory(cat.id) }
                                } label: {
                                    HStack(spacing: 6) {
                                        Text(cat.icon)
                                        Text(cat.name)
                                    }
                                    .font(.subheadline.bold())
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 8)
                                    .background(viewModel.selectedCategoryId == cat.id ? feedUpRed : Color(.systemGray6))
                                    .foregroundColor(viewModel.selectedCategoryId == cat.id ? .white : .primary)
                                    .cornerRadius(20)
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                    
                    // Products Grid
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)], spacing: 14) {
                        ForEach(viewModel.products) { product in
                            ProductCardView(product: product) {
                                cart.add(product: product)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .navigationTitle("FeedUp Menyu")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingCart = true
                    } label: {
                        ZStack(alignment: .topTrailing) {
                            Image(systemName: "bag.fill")
                                .font(.title3)
                                .foregroundColor(feedUpRed)
                            
                            if cart.totalItemCount > 0 {
                                Text("\(cart.totalItemCount)")
                                    .font(.caption2.bold())
                                    .foregroundColor(.white)
                                    .frame(width: 18, height: 18)
                                    .background(feedUpRed)
                                    .clipShape(Circle())
                                    .offset(x: 8, y: -8)
                            }
                        }
                    }
                }
            }
            .sheet(isPresented: $showingCart) {
                CartView()
            }
            .task {
                await viewModel.loadData()
            }
        }
    }
}

// Subview: Product Card
struct ProductCardView: View {
    let product: Product
    let onAddToCart: () -> Void
    let feedUpRed = Color(red: 0.89, green: 0.12, blue: 0.14)
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Food Image
            AsyncImage(url: product.resolvedImageURL) { phase in
                switch phase {
                case .empty:
                    Rectangle()
                        .fill(Color(.systemGray5))
                        .frame(height: 120)
                case .success(let image):
                    image
                        .resizable()
                        .scaledToFill()
                        .frame(height: 120)
                        .clipped()
                case .failure:
                    Rectangle()
                        .fill(Color(.systemGray5))
                        .frame(height: 120)
                        .overlay(Image(systemName: "fork.knife").foregroundColor(.gray))
                @unknown default:
                    EmptyView()
                }
            }
            .cornerRadius(12)
            
            // Name
            Text(product.name)
                .font(.subheadline.bold())
                .lineLimit(2)
                .foregroundColor(.primary)
            
            // Price & Add Button
            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 2) {
                    if product.hasDiscount, let formattedOldPrice = product.formattedOldPrice {
                        Text(formattedOldPrice)
                            .font(.caption2)
                            .strikethrough()
                            .foregroundColor(.secondary)
                    }
                    Text(product.formattedPrice)
                        .font(.footnote.bold())
                        .foregroundColor(feedUpRed)
                }

                Spacer()
                
                Button(action: onAddToCart) {
                    Image(systemName: "plus")
                        .font(.caption.bold())
                        .foregroundColor(.white)
                        .frame(width: 28, height: 28)
                        .background(feedUpRed)
                        .clipShape(Circle())
                }
            }
        }
        .padding(10)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
    }
}

