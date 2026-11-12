//
//  BranchListView.swift
//  FeedUp iOS App
//

import SwiftUI

public struct BranchListView: View {
    @State private var branches: [Branch] = []
    @State private var isLoading = false
    let feedUpRed = Color(red: 0.89, green: 0.12, blue: 0.14)
    
    public init() {}
    
    public var body: some View {
        NavigationStack {
            List(branches) { branch in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(branch.name)
                            .font(.headline)
                        Spacer()
                        Text(branch.isOpen ? "Ochiq" : "Yopiq")
                            .font(.caption2.bold())
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(branch.isOpen ? Color.green.opacity(0.15) : Color.red.opacity(0.15))
                            .foregroundColor(branch.isOpen ? .green : .red)
                            .cornerRadius(6)
                    }
                    
                    HStack(spacing: 6) {
                        Image(systemName: "mappin.and.ellipse")
                            .foregroundColor(feedUpRed)
                            .font(.caption)
                        Text(branch.address)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    if let hours = branch.openingHours {
                        HStack(spacing: 6) {
                            Image(systemName: "clock")
                                .foregroundColor(.gray)
                                .font(.caption)
                            Text("Ish vaqti: \(hours)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    Button {
                        if let url = URL(string: "tel://\(branch.phone.replacingOccurrences(of: " ", with: ""))") {
                            #if os(iOS)
                            UIApplication.shared.open(url)
                            #endif
                        }
                    } label: {
                        HStack {
                            Image(systemName: "phone.fill")
                            Text(branch.phone)
                        }
                        .font(.caption.bold())
                        .foregroundColor(feedUpRed)
                        .padding(.top, 4)
                    }
                }
                .padding(.vertical, 4)
            }
            .navigationTitle("Filiallar")
            .task {
                do {
                    self.branches = try await FeedUpAPIService.shared.getBranches()
                } catch {
                    print("Branches load error: \(error)")
                }
            }
        }
    }
}

