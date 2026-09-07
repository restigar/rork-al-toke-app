import SwiftUI
import PhotosUI

/// Perfil del cliente: datos, edición, términos, contacto y eliminación de cuenta.
struct ClientePerfilView: View {
    @Environment(AppState.self) private var appState
    @State private var showEditar = false
    @State private var showEliminarConfirmacion = false
    @State private var isEliminando = false
    @State private var mensajeError: String?

    var body: some View {
        @Bindable var appState = appState

        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    tarjetaPerfil

                    VStack(spacing: 2) {
                        fila(icono: "person.crop.circle", texto: "Editar perfil", fondo: .mint.opacity(0.18), colorIcono: .brand) {
                            showEditar = true
                        }
                        Divider().padding(.leading, 56)
                        NavigationLink {
                            TerminosView()
                        } label: {
                            filaInterna(icono: "doc.text", texto: "Términos y Condiciones", fondo: Color(hex: "#dbeafe"), colorIcono: .accentBlue)
                        }
                        Divider().padding(.leading, 56)
                        NavigationLink {
                            PoliticaView()
                        } label: {
                            filaInterna(icono: "lock.shield", texto: "Política de Privacidad", fondo: Color(hex: "#fef3c7"), colorIcono: .accentAmber)
                        }
                        Divider().padding(.leading, 56)
                        fila(icono: "message.fill", texto: "Soporte por WhatsApp", fondo: Color(hex: "#dcfce7"), colorIcono: .whatsapp) {
                            abrir("https://wa.me/5493756441056")
                        }
                        Divider().padding(.leading, 56)
                        fila(icono: "envelope.fill", texto: "info@al-toke.com", fondo: Color(hex: "#fee2e2"), colorIcono: .mailRed) {
                            abrir("mailto:info@al-toke.com")
                        }
                    }
                    .background(Color.white)
                    .clipShape(.rect(cornerRadius: 14))
                    .overlay {
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.appBorder, lineWidth: 1)
                    }

                    VStack(spacing: 2) {
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

                    if let mensajeError {
                        Text(mensajeError)
                            .font(.system(size: 13))
                            .foregroundStyle(.red)
                    }

                    AppFooter()
                }
                .padding(16)
            }
            .background(Color.appBackground)
            .navigationTitle("Mi Perfil")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.brand, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .tint(.brand)
            .sheet(isPresented: $showEditar) {
                EditarPerfilView()
            }
            .confirmationDialog(
                "¿Eliminar tu cuenta?",
                isPresented: $showEliminarConfirmacion,
                titleVisibility: .visible
            ) {
                Button("Eliminar definitivamente", role: .destructive) {
                    Task { await eliminarCuenta() }
                }
                Button("Cancelar", role: .cancel) {}
            } message: {
                Text("Se borrarán tu cuenta y todos tus datos. Esta acción no se puede deshacer.")
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
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(Color.mint.opacity(0.25))
                    .frame(width: 68, height: 68)
                if let url = URL(string: appState.perfil?.fotoPerfil ?? "") {
                    AsyncImage(url: url) { phase in
                        if let image = phase.image {
                            image.resizable().scaledToFill()
                        } else {
                            Image(systemName: "person.fill")
                                .font(.system(size: 28))
                                .foregroundStyle(.brand)
                        }
                    }
                    .frame(width: 68, height: 68)
                    .clipShape(.circle)
                } else {
                    Image(systemName: "person.fill")
                        .font(.system(size: 28))
                        .foregroundStyle(.brand)
                }
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(appState.perfil?.name ?? "")
                    .font(.system(size: 19, weight: .bold))
                    .foregroundStyle(.appText)
                Text(appState.perfil?.email ?? "")
                    .font(.system(size: 13))
                    .foregroundStyle(.appSecondary)
                if let numero = appState.perfil?.numeroMostrado, !numero.isEmpty {
                    Text("N° \(numero)")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(.brand)
                }
            }
            Spacer()
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
            filaInterna(icono: icono, texto: texto, fondo: fondo, colorIcono: colorIcono)
        }
    }

    private func filaInterna(icono: String, texto: String, fondo: Color, colorIcono: Color) -> some View {
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
        .contentShape(Rectangle())
    }

    private func abrir(_ url: String) {
        if let url = URL(string: url) {
            UIApplication.shared.open(url)
        }
    }

    private func eliminarCuenta() async {
        isEliminando = true
        mensajeError = nil
        do {
            try await appState.eliminarCuenta()
        } catch {
            mensajeError = FirebaseService.mensajeAmigable(error)
        }
        isEliminando = false
    }
}

/// Edición de perfil compartida entre cliente y comercio.
struct EditarPerfilView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var phone = ""
    @State private var nombreComercio = ""
    @State private var fotoItem: PhotosPickerItem?
    @State private var imagenNueva: UIImage?
    @State private var isLoading = false
    @State private var mensajeError: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    fotoPicker

                    if appState.perfil?.esComercio == true {
                        FieldLabel(text: "Nombre del negocio")
                        TextField("Mi Negocio", text: $nombreComercio)
                            .styledField()
                    }

                    FieldLabel(text: appState.perfil?.esComercio == true ? "Responsable" : "Nombre completo")
                    TextField("Nombre", text: $name)
                        .styledField()

                    FieldLabel(text: "Teléfono")
                    TextField("+54 9 ...", text: $phone)
                        .keyboardType(.phonePad)
                        .styledField()

                    if let mensajeError {
                        Text(mensajeError)
                            .font(.system(size: 13))
                            .foregroundStyle(.red)
                    }

                    BrandButton(title: "Guardar cambios", backgroundColor: .mint, isLoading: isLoading) {
                        Task { await guardar() }
                    }
                }
                .padding(16)
            }
            .background(Color.appBackground)
            .navigationTitle("Editar perfil")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
            }
            .tint(.brand)
            .onAppear { precargar() }
        }
    }

    private var fotoPicker: some View {
        HStack {
            ZStack {
                Circle()
                    .fill(Color.mint.opacity(0.25))
                    .frame(width: 84, height: 84)
                if let imagenNueva {
                    Image(uiImage: imagenNueva)
                        .resizable().scaledToFill()
                        .frame(width: 84, height: 84)
                        .clipShape(.circle)
                } else if let url = URL(string: appState.perfil?.fotoPerfil ?? "") {
                    AsyncImage(url: url) { phase in
                        if let image = phase.image {
                            image.resizable().scaledToFill()
                        } else {
                            Image(systemName: "camera.fill")
                                .foregroundStyle(.brand)
                        }
                    }
                    .frame(width: 84, height: 84)
                    .clipShape(.circle)
                } else {
                    Image(systemName: "camera.fill")
                        .font(.system(size: 24))
                        .foregroundStyle(.brand)
                }
            }
            PhotosPicker(selection: $fotoItem, matching: .images) {
                Text("Cambiar foto")
                    .font(.system(size: 14, weight: .medium))
            }
            .buttonStyle(.bordered)
        }
        .frame(maxWidth: .infinity)
        .padding(.bottom, 4)
        .onChange(of: fotoItem) {
            Task {
                if let data = try? await fotoItem?.loadTransferable(type: Data.self),
                   let imagen = UIImage(data: data) {
                    imagenNueva = imagen
                }
            }
        }
    }

    private func precargar() {
        guard let perfil = appState.perfil else { return }
        name = perfil.name
        phone = perfil.phone == "N/A" ? "" : perfil.phone
        nombreComercio = perfil.nombre
    }

    private func guardar() async {
        guard var perfil = appState.perfil else { return }
        guard !name.isEmpty else {
            mensajeError = "El nombre no puede estar vacío."
            return
        }
        isLoading = true
        mensajeError = nil
        perfil.name = name
        perfil.phone = phone.isEmpty ? "N/A" : phone
        if perfil.esComercio { perfil.nombre = nombreComercio }

        do {
            if let imagenNueva, let data = imagenNueva.jpegData(compressionQuality: 0.7) {
                let path = "perfiles/\(perfil.id)/\(UUID().uuidString).jpg"
                perfil.fotoPerfil = try await FirebaseService.subirImagen(data: data, path: path)
            }
            try await appState.actualizarPerfil(perfil)
            dismiss()
        } catch {
            mensajeError = FirebaseService.mensajeAmigable(error)
        }
        isLoading = false
    }
}
