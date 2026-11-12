//
//  RootView.swift
//  FeedUp iOS App
//

import SwiftUI

public struct RootView: View {
    @ObservedObject private var cart = CartManager.shared
    let feedUpRed = Color(red: 0.89, green: 0.12, blue: 0.14)
    
    public init() {}
    
    public var body: some View {
        TabView {
            HomeMenuView()
                .tabItem {
                    Label("Menyu", systemImage: "fork.knife")
                }
            
            CartView()
                .tabItem {
                    Label("Savat", systemImage: "cart")
                }
                .badge(cart.totalItemCount)
            
            BranchListView()
                .tabItem {
                    Label("Filiallar", systemImage: "map")
                }
        }
        .tint(feedUpRed)
    }
}

