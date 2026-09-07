import SwiftUI

/// Panel principal del comercio: perfil, accesos a ofertas, información y cuenta.
struct ComercioDashboardView: View {
    @Environment(AppState.self) private var appState
    @State private var showEditar = false
    @State private var showEliminarConfirmacion = false
    @State private var isEliminando = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    tarjetaPerfil
                    acciones
                    botonesCuenta
                    AppFooter()
                }
                .padding(16)
            }
            .background(Color.appBackground)
            .navigationTitle("Panel de Comercio")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.brand, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .tint(.brand)
            .sheet(isPresented: $showEditar) {
                EditarPerfilView()
            }
            .confirmationDialog("¿Eliminar tu cuenta?", isPresented: $showEliminarConfirmacion, titleVisibility: .visible) {
                Button("Eliminar definitivamente", role: .destructive) {
                    Task { await eliminarCuenta() }
                }
                Button("Cancelar", role: .cancel) {}
            } message: {
                Text("Se borrarán tu comercio, tus ofertas y todos tus datos. Esta acción no se puede deshacer.")
            }
            .overlay {
                if isEliminando {
                    Color.black.opacity(0.4).ignoresSafeArea()
                    ProgressView("Eliminando cuenta...")
                        .padding(20)
                        .background(.white)
                        .clipShape(.rect(cornerRadius: 12))
                }
            }
        }
    }

    private var tarjetaPerfil: some View {
        VStack(spacing: 14) {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(Color.mint.opacity(0.25))
                        .frame(width: 72, height: 72)
                    if let url = URL(string: appState.perfil?.fotoPerfil ?? "") {
                        AsyncImage(url: url) { phase in
                            if let image = phase.image {
                                image.resizable().scaledToFill()
                            } else {
                                Image(systemName: "storefront")
                                    .font(.system(size: 30))
                                    .foregroundStyle(.brand)
                            }
                        }
                        .frame(width: 72, height: 72)
                        .clipShape(.circle)
                    } else {
                        Image(systemName: "storefront")
                            .font(.system(size: 30))
                            .foregroundStyle(.brand)
                    }
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(appState.perfil?.nombreMostrado ?? "")
                        .font(.system(size: 19, weight: .bold))
                        .foregroundStyle(.appText)
                    Text("N° \(appState.perfil?.numeroMostrado ?? "")")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.brand)
                    if let subRubro = appState.perfil?.subRubro, !subRubro.isEmpty {
                        Text(subRubro)
                            .font(.system(size: 12))
                            .foregroundStyle(.appSecondary)
                    }
                }
                Spacer()
            }
            HStack(spacing: 12) {
                Link(destination: URL(string: "https://wa.me/5493756441056")!) {
                    Label("WhatsApp", systemImage: "message.fill")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.whatsapp)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color.white)
                        .clipShape(.capsule)
                        .overlay { Capsule().stroke(Color.appBorder, lineWidth: 1) }
                }
                Link(destination: URL(string: "mailto:info@al-toke.com")!) {
                    Label("Correo", systemImage: "envelope.fill")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.mailRed)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color.white)
                        .clipShape(.capsule)
                        .overlay { Capsule().stroke(Color.appBorder, lineWidth: 1) }
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

    private var acciones: some View {
        VStack(spacing: 12) {
            NavigationLink {
                CargarOfertaView()
            } label: {
                tarjetaAccion(icono: "tag.fill", titulo: "Cargar Ofertas", colorIcono: .accentGreen, fondoIcono: Color(hex: "#dcfce7"))
            }
            NavigationLink {
                InformacionComercioView()
            } label: {
                tarjetaAccion(icono: "doc.text.fill", titulo: "Información de Comercio", colorIcono: .accentBlue, fondoIcono: Color(hex: "#dbeafe"))
            }
            NavigationLink {
                OfertasActivasView()
            } label: {
                tarjetaAccion(icono: "list.bullet", titulo: "Ofertas Activas", colorIcono: .accentAmber, fondoIcono: Color(hex: "#fef3c7"))
            }
        }
    }

    private var botonesCuenta: some View {
        VStack(spacing: 2) {
            fila(icono: "person.crop.circle", texto: "Editar perfil", fondo: .mint.opacity(0.18), colorIcono: .brand) {
                showEditar = true
            }
            Divider().padding(.leading, 56)
            fila(icono: "rectangle.portrait.and.arrow.right", texto: "Cerrar sesión", fondo: Color(hex: "#f3f4f6"), colorIcono: .appSecondary) {
                try? appState.cerrarSesion()
            }
            Divider().padding(.leading, 56)
            fila(icono: "trash", texto: "Eliminar cuenta", fondo: Color(hex: "#fee2e2"), colorIcono: .red) {
                showEliminarConfirmacion = true
            }
        }
        .background(Color.white)
        .clipShape(.rect(cornerRadius: 14))
        .overlay {
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.appBorder, lineWidth: 1)
        }
    }

    private func tarjetaAccion(icono: String, titulo: String, colorIcono: Color, fondoIcono: Color) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(fondoIcono)
                    .frame(width: 54, height: 54)
                Image(systemName: icono)
                    .font(.system(size: 24))
                    .foregroundStyle(colorIcono)
            }
            Text(titulo)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.appText)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 13))
                .foregroundStyle(Color(hex: "#d1d5db"))
        }
        .padding(14)
        .background(Color.white)
        .clipShape(.rect(cornerRadius: 14))
        .overlay {
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.appBorder, lineWidth: 1)
        }
    }

    private func fila(icono: String, texto: String, fondo: Color, colorIcono: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(fondo)
                        .frame(width: 34, height: 34)
                    Image(systemName: icono)
                        .font(.system(size: 15))
                        .foregroundStyle(colorIcono)
                }
                Text(texto)
                    .font(.system(size: 15))
                    .foregroundStyle(.appText)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundStyle(Color(hex: "#d1d5db"))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 11)
        }
    }

    private func eliminarCuenta() async {
        isEliminando = true
        do {
            try await appState.eliminarCuenta()
        } catch {
            print("⚠️ Error al eliminar cuenta: \(error.localizedDescription)")
        }
        isEliminando = false
    }
}
