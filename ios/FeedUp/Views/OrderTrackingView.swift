//
//  OrderTrackingView.swift
//  FeedUp iOS App
//

import SwiftUI

public struct OrderTrackingView: View {
    @State public var order: Order
    let feedUpRed = Color(red: 0.89, green: 0.12, blue: 0.14)
    
    public init(order: Order) {
        _order = State(initialValue: order)
    }
    
    public var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                VStack(spacing: 8) {
                    Text("Buyurtma #\(order.orderNumber)")
                        .font(.title2.bold())
                        .foregroundColor(feedUpRed)
                    
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)
                        Text("Jonli monitoring")
                            .font(.caption.bold())
                            .foregroundColor(.green)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(12)
                }
                .padding(.top)
                
                // Stepper Progression
                VStack(alignment: .leading, spacing: 20) {
                    TrackStepRow(
                        title: "Buyurtma qabul qilindi",
                        subtitle: "Tizimda muvaffaqiyatli qayd etildi",
                        isCompleted: true,
                        isCurrent: order.status == .pending
                    )
                    
                    TrackStepRow(
                        title: "Oshxonada tayyorlanmoqda",
                        subtitle: "Oshpazlarimiz taomni tayyorlamoqda",
                        isCompleted: [.preparing, .onTheWay, .delivered].contains(order.status),
                        isCurrent: order.status == .preparing
                    )
                    
                    TrackStepRow(
                        title: "Kuryer yo'lda",
                        subtitle: "Issiq holda siz tomon shoshilmoqda",
                        isCompleted: [.onTheWay, .delivered].contains(order.status),
                        isCurrent: order.status == .onTheWay
                    )
                    
                    TrackStepRow(
                        title: "Yetkazib berildi",
                        subtitle: "Yoqimli ishtaha tilaymiz!",
                        isCompleted: order.status == .delivered,
                        isCurrent: order.status == .delivered
                    )
                }
                .padding(20)
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
                .padding(.horizontal)
                
                // Order Info Card
                VStack(alignment: .leading, spacing: 12) {
                    Text("Buyurtma ma'lumotlari")
                        .font(.headline)
                    
                    HStack {
                        Text("Mijoz:")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(order.customerName)
                            .bold()
                    }
                    
                    HStack {
                        Text("Telefon:")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(order.customerPhone)
                            .bold()
                    }
                    
                    HStack(alignment: .top) {
                        Text("Manzil:")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(order.customerAddress)
                            .bold()
                            .multilineTextAlignment(.trailing)
                    }
                    
                    Divider()
                    
                    HStack {
                        Text("Jami to'lov:")
                            .font(.headline)
                        Spacer()
                        Text(order.formattedTotal)
                            .font(.title3.bold())
                            .foregroundColor(feedUpRed)
                    }
                }
                .font(.subheadline)
                .padding(20)
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
                .padding(.horizontal)
                
                // Call Support button
                Button {
                    if let url = URL(string: "tel://+998712002211") {
                        #if os(iOS)
                        UIApplication.shared.open(url)
                        #endif
                    }
                } label: {
                    HStack {
                        Image(systemName: "phone.fill")
                        Text("Call-markaz bilan bog'lanish: +998 71 200 22 11")
                    }
                    .font(.subheadline.bold())
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.black)
                    .cornerRadius(14)
                }
                .padding(.horizontal)
            }
            .padding(.bottom)
        }
        .refreshable {
            await refresh()
        }
    }
    
    private func refresh() async {
        do {
            let updated = try await FeedUpAPIService.shared.trackOrder(orderNumberOrId: order.orderNumber)
            self.order = updated
        } catch {
            print("Refresh failed: \(error)")
        }
    }
}

struct TrackStepRow: View {
    let title: String
    let subtitle: String
    let isCompleted: Bool
    let isCurrent: Bool
    let feedUpRed = Color(red: 0.89, green: 0.12, blue: 0.14)
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(isCompleted ? feedUpRed : Color(.systemGray4))
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

