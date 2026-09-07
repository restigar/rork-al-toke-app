import SwiftUI
import CoreLocation

/// Vista principal del cliente: pestañas de comercios y perfil.
struct ClienteTabView: View {
    @State private var tab = 0

    var body: some View {
        TabView(selection: $tab) {
            ClienteHomeView()
                .tabItem { Label("Comercios", systemImage: "storefront") }
                .tag(0)
            ClientePerfilView()
                .tabItem { Label("Perfil", systemImage: "person.fill") }
                .tag(1)
        }
        .tint(.brand)
    }
}

/// Listado de comercios con búsqueda, filtro "abiertos" y distancia.
struct ClienteHomeView: View {
    @Environment(AppState.self) private var appState
    @State private var comercios: [UserProfile] = []
    @State private var isLoading = true
    @State private var searchText = ""
    @State private var soloAbiertos = false
    @State private var mensajeError: String?

    private var locationManager: LocationManager { LocationManager.shared }

    /// Comercios filtrados y ordenados por distancia si hay ubicación.
    private var resultados: [ComercioConDistancia] {
        var lista = comercios.map { comercio in
            ComercioConDistancia(
                comercio: comercio,
                distancia: distanciaPara(comercio),
                estaAbierto: comercio.horarios.isEmpty ? true : comercio.horarios.contains { $0.dia == FechaHelper.nombreDiaSemana(Date()) && $0.estaAbierto() }
            )
        }
        if !searchText.isEmpty {
            let query = searchText.lowercased()
            lista = lista.filter {
                $0.comercio.nombreMostrado.lowercased().contains(query)
                    || $0.comercio.rubro.lowercased().contains(query)
                    || $0.comercio.subRubro.lowercased().contains(query)
            }
        }
        if soloAbiertos {
            lista = lista.filter(\.estaAbierto)
        }
        return lista.sorted { ($0.distancia ?? .greatestFiniteMagnitude) < ($1.distancia ?? .greatestFiniteMagnitude) }
    }

    private func distanciaPara(_ comercio: UserProfile) -> Double? {
        guard let ubicacion = locationManager.ubicacion,
              comercio.latitud != 0 || comercio.longitud != 0 else { return nil }
        return FechaHelper.distanciaKm(
            lat1: ubicacion.coordinate.latitude,
            lon1: ubicacion.coordinate.longitude,
            lat2: comercio.latitud,
            lon2: comercio.longitud
        )
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                header
                filtroChips
                if isLoading {
                    Spacer()
                    ProgressView("Cargando comercios...")
                    Spacer()
                } else if let mensajeError {
                    Spacer()
                    VStack(spacing: 12) {
                        Image(systemName: "wifi.exclamationmark")
                            .font(.system(size: 40))
                            .foregroundStyle(.appSecondary)
                        Text(mensajeError)
                            .font(.system(size: 14))
                            .foregroundStyle(.appSecondary)
                            .multilineTextAlignment(.center)
                        Button("Reintentar") { Task { await cargarComercios() } }
                            .buttonStyle(.borderedProminent)
                    }
                    .padding(32)
                    Spacer()
                } else if resultados.isEmpty {
                    Spacer()
                    VStack(spacing: 10) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 40))
                            .foregroundStyle(.appSecondary)
                        Text("No se encontraron comercios")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundStyle(.appSecondary)
                    }
                    Spacer()
                } else {
                    List(resultados) { item in
                        NavigationLink {
                            ComercioDetailView(comercio: item.comercio)
                        } label: {
                            ComercioRow(item: item)
                        }
                        .listRowSeparator(.hidden)
                        .listRowBackground(Color.clear)
                        .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
                    }
                    .listStyle(.plain)
                }
            }
            .background(Color.appBackground)
            .navigationTitle("Al Toke")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.brand, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .searchable(text: $searchText, prompt: "Buscar comercios, rubros...")
            .task { await cargarComercios() }
            .refreshable { await cargarComercios() }
        }
    }

    private var header: some View {
        HStack {
            Image(systemName: "bolt.fill")
                .foregroundStyle(.brand)
            Text("Hola, \(appState.perfil?.name ?? "")")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(.appText)
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }

    private var filtroChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                chip("Todos", activo: !soloAbiertos) { soloAbiertos = false }
                chip("Abiertos ahora", activo: soloAbiertos) { soloAbiertos = true }
            }
            .padding(.horizontal, 16)
        }
        .padding(.bottom, 8)
    }

    private func chip(_ texto: String, activo: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(texto)
                .font(.system(size: 13, weight: .medium))
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(activo ? Color.brand : Color.white)
                .foregroundStyle(activo ? .white : .appText)
                .clipShape(.capsule)
                .overlay {
                    Capsule().stroke(Color.appBorder, lineWidth: 1)
                }
        }
    }

    private func cargarComercios() async {
        isLoading = comercios.isEmpty
        mensajeError = nil
        do {
            comercios = try await FirebaseService.fetchComercios()
        } catch {
            mensajeError = FirebaseService.mensajeAmigable(error)
        }
        isLoading = false
    }
}

struct ComercioConDistancia: Identifiable {
    let comercio: UserProfile
    let distancia: Double?
    let estaAbierto: Bool
    var id: String { comercio.id }
}

/// Fila de comercio en los resultados.
struct ComercioRow: View {
    let item: ComercioConDistancia

    var body: some View {
        HStack(spacing: 12) {
            avatar
            VStack(alignment: .leading, spacing: 4) {
                Text(item.comercio.nombreMostrado)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.appText)
                if !item.comercio.subRubro.isEmpty || !item.comercio.rubro.isEmpty {
                    Text([item.comercio.rubro, item.comercio.subRubro].filter { !$0.isEmpty }.joined(separator: " • "))
                        .font(.system(size: 13))
                        .foregroundStyle(.appSecondary)
                }
                HStack(spacing: 8) {
                    estadoBadge
                    if let distancia = item.distancia {
                        Label(String(format: "%.1f km", distancia), systemImage: "location")
                            .font(.system(size: 12))
                            .foregroundStyle(.appSecondary)
                    }
                }
            }
            Spacer()
        }
        .padding(12)
        .background(Color.white)
        .clipShape(.rect(cornerRadius: 14))
        .overlay {
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.appBorder, lineWidth: 1)
        }
    }

    @ViewBuilder private var avatar: some View {
        if let url = URL(string: item.comercio.fotoPerfil) {
            AsyncImage(url: url) { phase in
                if let image = phase.image {
                    image.resizable().scaledToFill()
                } else {
                    placeholderAvatar
                }
            }
            .frame(width: 56, height: 56)
            .clipShape(.rect(cornerRadius: 12))
        } else {
            placeholderAvatar
        }
    }

    private var placeholderAvatar: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.mint.opacity(0.2))
                .frame(width: 56, height: 56)
            Image(systemName: "storefront")
                .font(.system(size: 24))
                .foregroundStyle(.brand)
        }
    }

    private var estadoBadge: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(item.estaAbierto ? Color.accentGreen : Color.appSecondary)
                .frame(width: 7, height: 7)
            Text(item.estaAbierto ? "Abierto" : "Cerrado")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(item.estaAbierto ? Color.accentGreen : .appSecondary)
        }
    }
}
