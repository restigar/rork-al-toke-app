import SwiftUI
import PhotosUI

/// Publicación de ofertas: la vigencia respeta el horario de apertura/cierre
/// del comercio en las fechas elegidas (misma lógica que la app Expo).
struct CargarOfertaView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var titulo = ""
    @State private var descripcion = ""
    @State private var precio = ""
    @State private var vigenciaInicio = Date()
    @State private var vigenciaFin = Date()
    @State private var imagenItem: PhotosPickerItem?
    @State private var imagen: UIImage?
    @State private var isLoading = false
    @State private var mensajeError: String?
    @State private var publicacionExitosa: String?

    private var perfil: UserProfile? { appState.perfil }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                FieldLabel(text: "Título de la oferta")
                TextField("2x1 en pizzas", text: $titulo)
                    .styledField()

                FieldLabel(text: "Descripción")
                TextField("Contá los detalles de tu promoción", text: $descripcion, axis: .vertical)
                    .lineLimit(3...6)
                    .styledField()

                FieldLabel(text: "Precio")
                TextField("0", text: $precio)
                    .keyboardType(.decimalPad)
                    .styledField()

                FieldLabel(text: "Fecha de inicio")
                DatePicker("Fecha de inicio", selection: $vigenciaInicio, in: Date()..., displayedComponents: [.date])
                    .datePickerStyle(.graphical)
                    .tint(.brand)
                    .padding(10)
                    .background(Color.white)
                    .clipShape(.rect(cornerRadius: 12))
                    .overlay {
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.appBorder, lineWidth: 1)
                    }
                    .accessibilityLabel("Seleccionar fecha de inicio")

                FieldLabel(text: "Fecha de fin")
                DatePicker("Fecha de fin", selection: $vigenciaFin, in: vigenciaInicio..., displayedComponents: [.date])
                    .datePickerStyle(.graphical)
                    .tint(.brand)
                    .padding(10)
                    .background(Color.white)
                    .clipShape(.rect(cornerRadius: 12))
                    .overlay {
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.appBorder, lineWidth: 1)
                    }
                    .accessibilityLabel("Seleccionar fecha de fin")

                FieldLabel(text: "Imagen de la oferta (opcional)")
                imagenPicker

                if let mensajeError {
                    Text(mensajeError)
                        .font(.system(size: 13))
                        .foregroundStyle(.red)
                }

                BrandButton(title: "Publicar oferta", backgroundColor: .accentGreen, isLoading: isLoading) {
                    Task { await publicar() }
                }
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .navigationTitle("Cargar Oferta")
        .navigationBarTitleDisplayMode(.inline)
        .tint(.brand)
        .onAppear {
            vigenciaFin = vigenciaInicio
        }
        .onChange(of: vigenciaInicio) {
            if vigenciaFin < vigenciaInicio { vigenciaFin = vigenciaInicio }
        }
        .alert("Oferta publicada", isPresented: Binding(
            get: { publicacionExitosa != nil },
            set: { if !$0 { publicacionExitosa = nil; dismiss() } }
        )) {
            Button("OK") {
                publicacionExitosa = nil
                dismiss()
            }
        } message: {
            Text(publicacionExitosa ?? "")
        }
    }

    private var imagenPicker: some View {
        VStack(spacing: 10) {
            if let imagen {
                Image(uiImage: imagen)
                    .resizable().scaledToFill()
                    .frame(height: 150)
                    .frame(maxWidth: .infinity)
                    .clipped()
                    .clipShape(.rect(cornerRadius: 12))
            }
            PhotosPicker(selection: $imagenItem, matching: .images) {
                Label(imagen == nil ? "Seleccionar imagen" : "Cambiar imagen", systemImage: "photo")
                    .font(.system(size: 14, weight: .medium))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 11)
                    .background(Color.white)
                    .clipShape(.rect(cornerRadius: 12))
                    .overlay {
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.appBorder, lineWidth: 1)
                    }
            }
        }
        .onChange(of: imagenItem) {
            Task {
                if let data = try? await imagenItem?.loadTransferable(type: Data.self) {
                    imagen = UIImage(data: data)
                }
            }
        }
    }

    private func publicar() async {
        guard let perfil else { return }
        guard !titulo.isEmpty, !descripcion.isEmpty else {
            mensajeError = "Completá el título y la descripción."
            return
        }
        guard let precioNumero = Double(precio.replacingOccurrences(of: ",", with: ".")) else {
            mensajeError = "El precio debe ser un número válido."
            return
        }

        isLoading = true
        mensajeError = nil

        // Vigencia: inicia en el horario de apertura del comercio ese día
        // y finaliza en el horario de cierre de ese día (o 00:00/23:59 si cierra).
        let horarioInicio = FechaHelper.horarioApertura(horarios: perfil.horarios, fecha: vigenciaInicio)
        let horarioFin = FechaHelper.horarioCierre(horarios: perfil.horarios, fecha: vigenciaFin)
        let inicio = FechaHelper.fecha(vigenciaInicio, hora: horarioInicio)
        let fin = FechaHelper.fecha(vigenciaFin, hora: horarioFin, finDelDia: true)

        var oferta = Oferta(
            id: UUID().uuidString,
            comercioId: perfil.id,
            comercioNombre: perfil.nombreMostrado,
            titulo: titulo,
            descripcion: descripcion,
            precio: precioNumero,
            vigenciaInicio: inicio,
            vigenciaFin: fin
        )

        do {
            if let imagen, let data = imagen.jpegData(compressionQuality: 0.7) {
                let path = "ofertas/\(perfil.id)/\(oferta.id).jpg"
                oferta.imagenUrl = try await FirebaseService.subirImagen(data: data, path: path)
            }
            try await FirebaseService.saveOferta(oferta)
            isLoading = false
            publicacionExitosa = "Vigencia:\nDesde: \(FechaHelper.formatearCompleto(inicio))\nHasta: \(FechaHelper.formatearCompleto(fin))"
        } catch {
            isLoading = false
            mensajeError = FirebaseService.mensajeAmigable(error)
        }
    }
}

/// Listado de ofertas del comercio con estado de vigencia y opción de eliminar.
struct OfertasActivasView: View {
    @Environment(AppState.self) private var appState
    @State private var ofertas: [Oferta] = []
    @State private var isLoading = true
    @State private var ofertaAEliminar: Oferta?

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Cargando ofertas...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if ofertas.isEmpty {
                VStack(spacing: 10) {
                    Image(systemName: "tag.slash")
                        .font(.system(size: 40))
                        .foregroundStyle(.appSecondary)
                    Text("No tenés ofertas cargadas")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(.appSecondary)
                    NavigationLink {
                        CargarOfertaView()
                    } label: {
                        Text("Cargar primera oferta")
                            .font(.system(size: 15, weight: .semibold))
                            .padding(.horizontal, 18)
                            .padding(.vertical, 10)
                            .background(Color.accentGreen)
                            .foregroundStyle(.white)
                            .clipShape(.capsule)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List {
                    ForEach(ofertas) { oferta in
                        OfertaAdminRow(oferta: oferta)
                            .listRowSeparator(.hidden)
                            .listRowBackground(Color.clear)
                            .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
                            .swipeActions(edge: .trailing) {
                                Button(role: .destructive) {
                                    ofertaAEliminar = oferta
                                } label: {
                                    Label("Eliminar", systemImage: "trash")
                                }
                            }
                    }
                }
                .listStyle(.plain)
            }
        }
        .background(Color.appBackground)
        .navigationTitle("Ofertas Activas")
        .navigationBarTitleDisplayMode(.inline)
        .task { await cargar() }
        .refreshable { await cargar() }
        .confirmationDialog("¿Eliminar esta oferta?", isPresented: Binding(
            get: { ofertaAEliminar != nil },
            set: { if !$0 { ofertaAEliminar = nil } }
        ), titleVisibility: .visible) {
            Button("Eliminar", role: .destructive) {
                Task { await eliminar(ofertaAEliminar) }
            }
            Button("Cancelar", role: .cancel) {}
        }
    }

    private func cargar() async {
        guard let perfil = appState.perfil else { return }
        isLoading = ofertas.isEmpty
        ofertas = (try? await FirebaseService.fetchOfertas(comercioId: perfil.id)) ?? []
        isLoading = false
    }

    private func eliminar(_ oferta: Oferta?) async {
        guard let oferta else { return }
        try? await FirebaseService.deleteOferta(id: oferta.id)
        ofertas.removeAll { $0.id == oferta.id }
        ofertaAEliminar = nil
    }
}

struct OfertaAdminRow: View {
    let oferta: Oferta

    private var estado: (texto: String, color: Color) {
        if oferta.estaVigente() { return ("Activa", .accentGreen) }
        if oferta.esProxima() { return ("Próxima", .accentAmber) }
        return ("Finalizada", .appSecondary)
    }

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color(hex: "#f3f4f6"))
                    .frame(width: 64, height: 64)
                if let url = URL(string: oferta.imagenUrl) {
                    AsyncImage(url: url) { phase in
                        if let image = phase.image {
                            image.resizable().scaledToFill()
                        } else {
                            Image(systemName: "tag")
                                .foregroundStyle(.appSecondary)
                        }
                    }
                    .frame(width: 64, height: 64)
                    .clipShape(.rect(cornerRadius: 10))
                } else {
                    Image(systemName: "tag")
                        .foregroundStyle(.appSecondary)
                }
            }
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(oferta.titulo)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(.appText)
                        .lineLimit(1)
                    Spacer()
                    Text(estado.texto)
                        .font(.system(size: 11, weight: .bold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(estado.color.opacity(0.15))
                        .foregroundStyle(estado.color)
                        .clipShape(.capsule)
                }
                Text("$ \(String(format: "%.0f", oferta.precio))")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(estado.color)
                Text("Del \(FechaHelper.formatear(oferta.vigenciaInicio)) al \(FechaHelper.formatear(oferta.vigenciaFin))")
                    .font(.system(size: 12))
                    .foregroundStyle(.appSecondary)
            }
        }
        .padding(12)
        .background(Color.white)
        .clipShape(.rect(cornerRadius: 14))
        .overlay {
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.appBorder, lineWidth: 1)
        }
    }
}
