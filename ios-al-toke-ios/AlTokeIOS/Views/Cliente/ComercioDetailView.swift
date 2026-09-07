import SwiftUI
import MapKit

/// Detalle del comercio: información, horarios, contacto y ofertas vigentes.
struct ComercioDetailView: View {
    let comercio: UserProfile
    @State private var ofertas: [Oferta] = []
    @State private var isLoadingOfertas = true

    private var estaAbierto: Bool {
        comercio.horarios.isEmpty
            ? true
            : comercio.horarios.contains { $0.dia == FechaHelper.nombreDiaSemana(Date()) && $0.estaAbierto() }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                encabezado
                contacto
                if !comercio.horarios.isEmpty {
                    horarios
                }
                ofertasSection
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .navigationTitle(comercio.nombreMostrado)
        .navigationBarTitleDisplayMode(.inline)
        .task { await cargarOfertas() }
    }

    private var encabezado: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 14) {
                avatarGrande
                VStack(alignment: .leading, spacing: 6) {
                    Text(comercio.nombreMostrado)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(.appText)
                    if !comercio.subRubro.isEmpty {
                        Text([comercio.rubro, comercio.subRubro].filter { !$0.isEmpty }.joined(separator: " • "))
                            .font(.system(size: 14))
                            .foregroundStyle(.appSecondary)
                    }
                    HStack(spacing: 6) {
                        Circle()
                            .fill(estaAbierto ? Color.accentGreen : Color.appSecondary)
                            .frame(width: 8, height: 8)
                        Text(estaAbierto ? "Abierto ahora" : "Cerrado")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(estaAbierto ? Color.accentGreen : .appSecondary)
                    }
                    if !comercio.calle.isEmpty || !comercio.ciudad.isEmpty {
                        Label([comercio.calle, comercio.ciudad].filter { !$0.isEmpty }.joined(separator: ", "),
                              systemImage: "mappin.and.ellipse")
                            .font(.system(size: 13))
                            .foregroundStyle(.appSecondary)
                    }
                }
                Spacer()
            }
            if comercio.latitud != 0 || comercio.longitud != 0 {
                mapa
            }
        }
    }

    private var avatarGrande: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.mint.opacity(0.2))
                .frame(width: 84, height: 84)
            if let url = URL(string: comercio.fotoPerfil) {
                AsyncImage(url: url) { phase in
                    if let image = phase.image {
                        image.resizable().scaledToFill()
                    } else {
                        Image(systemName: "storefront")
                            .font(.system(size: 36))
                            .foregroundStyle(.brand)
                    }
                }
                .frame(width: 84, height: 84)
                .clipShape(.rect(cornerRadius: 16))
            } else {
                Image(systemName: "storefront")
                    .font(.system(size: 36))
                    .foregroundStyle(.brand)
            }
        }
    }

    private var mapa: some View {
        Button {
            abrirMapa()
        } label: {
            Map(initialPosition: .region(MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: comercio.latitud, longitude: comercio.longitud),
                span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
            ))) {
                Marker(comercio.nombreMostrado, coordinate: CLLocationCoordinate2D(latitude: comercio.latitud, longitude: comercio.longitud))
            }
            .frame(height: 140)
            .clipShape(.rect(cornerRadius: 14))
            .overlay(alignment: .bottomTrailing) {
                Label("Cómo llegar", systemImage: "location.fill")
                    .font(.system(size: 12, weight: .semibold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(.white)
                    .foregroundStyle(.brand)
                    .clipShape(.capsule)
                    .shadow(radius: 3)
                    .padding(8)
            }
        }
        .buttonStyle(.plain)
    }

    private var contacto: some View {
        HStack(spacing: 12) {
            if !comercio.phone.isEmpty, comercio.phone != "N/A" {
                botonContacto("Llamar", icono: "phone.fill", color: .brand) {
                    abrir("tel://\(comercio.phone.filter { !$0.isWhitespace })")
                }
            }
            botonContacto("WhatsApp", icono: "message.fill", color: .whatsapp) {
                let telefono = comercio.phone.filter { !$0.isWhitespace && $0 != "+" }
                abrir("https://wa.me/\(telefono)")
            }
            botonContacto("Email", icono: "envelope.fill", color: .mailRed) {
                abrir("mailto:\(comercio.email)")
            }
        }
    }

    private func botonContacto(_ titulo: String, icono: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: icono)
                    .font(.system(size: 20))
                    .foregroundStyle(color)
                Text(titulo)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.appText)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Color.white)
            .clipShape(.rect(cornerRadius: 12))
            .overlay {
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.appBorder, lineWidth: 1)
            }
        }
    }

    private var horarios: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Horarios", systemImage: "clock")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(.appText)
            ForEach(comercio.horarios, id: \.dia) { horario in
                HStack {
                    Text(horario.dia)
                        .font(.system(size: 14))
                        .foregroundStyle(.appText)
                    Spacer()
                    if horario.abierto {
                        let texto = horario.horarioCorrido
                            ? "\(horario.mananaInicio) - \(horario.mananaFin)"
                            : "\(horario.mananaInicio) - \(horario.mananaFin) · \(horario.tardeInicio) - \(horario.tardeFin)"
                        Text(texto)
                            .font(.system(size: 13))
                            .foregroundStyle(.appSecondary)
                    } else {
                        Text("Cerrado")
                            .font(.system(size: 13))
                            .foregroundStyle(.appSecondary)
                    }
                }
            }
        }
        .padding(14)
        .background(Color.white)
        .clipShape(.rect(cornerRadius: 14))
        .overlay {
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.appBorder, lineWidth: 1)
        }
    }

    private var ofertasSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Ofertas vigentes", systemImage: "tag.fill")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(.appText)
            if isLoadingOfertas {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
            } else if ofertas.isEmpty {
                Text("Este comercio no tiene ofertas vigentes por el momento.")
                    .font(.system(size: 14))
                    .foregroundStyle(.appSecondary)
                    .padding(.vertical, 8)
            } else {
                ForEach(ofertas) { oferta in
                    OfertaCard(oferta: oferta, mostrarComercio: false)
                }
            }
        }
    }

    private func cargarOfertas() async {
        isLoadingOfertas = true
        ofertas = (try? await FirebaseService.fetchOfertas(comercioId: comercio.id))?
            .filter { $0.estaVigente() } ?? []
        isLoadingOfertas = false
    }

    private func abrir(_ url: String) {
        if let url = URL(string: url) {
            UIApplication.shared.open(url)
        }
    }

    private func abrirMapa() {
        let query = "https://maps.apple.com/?q=\(comercio.nombreMostrado)&ll=\(comercio.latitud),\(comercio.longitud)"
        if let url = URL(string: query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query) {
            UIApplication.shared.open(url)
        }
    }
}

/// Tarjeta de oferta con imagen, precio y vigencia.
struct OfertaCard: View {
    let oferta: Oferta
    var mostrarComercio: Bool = true

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let url = URL(string: oferta.imagenUrl) {
                AsyncImage(url: url) { phase in
                    if let image = phase.image {
                        image.resizable().scaledToFill()
                    } else {
                        Color(hex: "#f3f4f6")
                    }
                }
                .frame(height: 150)
                .frame(maxWidth: .infinity)
                .clipped()
            }
            VStack(alignment: .leading, spacing: 5) {
                Text(oferta.titulo)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.appText)
                if mostrarComercio, !oferta.comercioNombre.isEmpty {
                    Text(oferta.comercioNombre)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.brand)
                }
                Text(oferta.descripcion)
                    .font(.system(size: 13))
                    .foregroundStyle(.appSecondary)
                    .lineLimit(3)
                HStack {
                    Text("Precio: $ " + String(format: "%.0f", oferta.precio))
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Color.accentGreen)
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("Vigente hasta")
                            .font(.system(size: 11))
                            .foregroundStyle(.appSecondary)
                        Text(FechaHelper.formatearCompleto(oferta.vigenciaFin))
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.appText)
                    }
                }
            }
            .padding(12)
        }
        .background(Color.white)
        .clipShape(.rect(cornerRadius: 14))
        .overlay {
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.appBorder, lineWidth: 1)
        }
    }
}
