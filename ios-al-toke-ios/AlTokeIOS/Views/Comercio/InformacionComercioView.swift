import SwiftUI
import CoreLocation

/// Información del comercio: datos, rubros, horarios y ubicación editables.
struct InformacionComercioView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var perfil = UserProfile(id: "", name: "", email: "", role: "Comercio", type: "comercio")
    @State private var isLoading = true
    @State private var isSaving = false
    @State private var mensajeError: String?
    @State private var usoMiUbicacion = false

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Cargando información...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                formulario
            }
        }
        .background(Color.appBackground)
        .navigationTitle("Información de Comercio")
        .navigationBarTitleDisplayMode(.inline)
        .tint(.brand)
        .onAppear { precargar() }
    }

    private var formulario: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                seccion("Datos del negocio") {
                    FieldLabel(text: "Nombre del negocio")
                    TextField("Mi Negocio", text: $perfil.nombre)
                        .styledField()

                    FieldLabel(text: "Tipo")
                    Picker("Tipo", selection: $perfil.tipoNegocio) {
                        ForEach(Rubros.tipos, id: \.self) { Text($0).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    FieldLabel(text: "Rubro")
                    Picker("Rubro", selection: $perfil.rubro) {
                        Text("Seleccionar").tag("")
                        ForEach(Rubros.categorias(tipo: perfil.tipoNegocio), id: \.self) { Text($0).tag($0) }
                    }
                    .styledField()

                    FieldLabel(text: "Subrubro")
                    Picker("Subrubro", selection: $perfil.subRubro) {
                        Text("Seleccionar").tag("")
                        ForEach(Rubros.subRubros(tipo: perfil.tipoNegocio, rubro: perfil.rubro), id: \.self) { Text($0).tag($0) }
                    }
                    .styledField()
                }

                seccion("Contacto") {
                    FieldLabel(text: "Teléfono")
                    TextField("+54 9 ...", text: $perfil.phone)
                        .keyboardType(.phonePad)
                        .styledField()

                    FieldLabel(text: "Facebook (opcional)")
                    TextField("facebook.com/minegocio", text: $perfil.facebook)
                        .textInputAutocapitalization(.never)
                        .styledField()

                    FieldLabel(text: "Instagram (opcional)")
                    TextField("@minegocio", text: $perfil.instagram)
                        .textInputAutocapitalization(.never)
                        .styledField()

                    FieldLabel(text: "Sitio web (opcional)")
                    TextField("https://...", text: $perfil.website)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.URL)
                        .styledField()
                }

                seccion("Ubicación") {
                    FieldLabel(text: "Calle y altura")
                    TextField("Av. San Martín 1234", text: $perfil.calle)
                        .styledField()

                    FieldLabel(text: "Ciudad")
                    TextField("Posadas", text: $perfil.ciudad)
                        .styledField()

                    Button {
                        usarUbicacionActual()
                    } label: {
                        Label(usoMiUbicacion ? "Ubicación actual guardada" : "Usar mi ubicación actual",
                              systemImage: "location.fill")
                            .font(.system(size: 14, weight: .medium))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 11)
                            .background(usoMiUbicacion ? Color.accentGreen.opacity(0.12) : Color.white)
                            .foregroundStyle(usoMiUbicacion ? Color.accentGreen : .brand)
                            .clipShape(.rect(cornerRadius: 12))
                            .overlay {
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.appBorder, lineWidth: 1)
                            }
                    }
                }

                seccion("Horarios de atención") {
                    ForEach($perfil.horarios, id: \.dia) { $horario in
                        filaHorario($horario)
                    }
                }

                if let mensajeError {
                    Text(mensajeError)
                        .font(.system(size: 13))
                        .foregroundStyle(.red)
                }

                BrandButton(title: "Guardar información", backgroundColor: .brand, isLoading: isSaving) {
                    Task { await guardar() }
                }
            }
            .padding(16)
        }
    }

    private func seccion<Contenido: View>(_ titulo: String, @ViewBuilder contenido: () -> Contenido) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(titulo)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(Color.appText)
            contenido()
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .clipShape(.rect(cornerRadius: 14))
        .overlay {
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.appBorder, lineWidth: 1)
        }
    }

    @ViewBuilder
    private func filaHorario(_ horario: Binding<DiaHorario>) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Toggle(horario.wrappedValue.dia, isOn: horario.abierto)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Color.appText)
                .tint(horario.wrappedValue.abierto ? Color.accentGreen : Color.appSecondary)
            if horario.wrappedValue.abierto {
                Toggle("Horario corrido", isOn: horario.horarioCorrido)
                    .font(.system(size: 13))
                    .tint(Color.brand)
                HStack(spacing: 12) {
                    selectorHoras("Apertura", seleccion: horario.mananaInicio)
                    selectorHoras(horario.wrappedValue.horarioCorrido ? "Cierre" : "Cierre mañana",
                                  seleccion: horario.mananaFin)
                }
                if !horario.wrappedValue.horarioCorrido {
                    HStack(spacing: 12) {
                        selectorHoras("Apertura tarde", seleccion: horario.tardeInicio)
                        selectorHoras("Cierre", seleccion: horario.tardeFin)
                    }
                }
            }
            Divider()
        }
    }

    private func selectorHoras(_ titulo: String, seleccion: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(titulo)
                .font(.system(size: 11))
                .foregroundStyle(Color.appSecondary)
            DatePicker(titulo, selection: Binding(
                get: { FechaHelper.fecha(Date(), hora: seleccion.wrappedValue) },
                set: { nuevoValor in
                    let componentes = Calendar.current.dateComponents([.hour, .minute], from: nuevoValor)
                    seleccion.wrappedValue = String(format: "%02d:%02d", componentes.hour ?? 0, componentes.minute ?? 0)
                }
            ), displayedComponents: .hourAndMinute)
            .labelsHidden()
            .tint(.brand)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func precargar() {
        if let actual = appState.perfil {
            perfil = actual
            if perfil.horarios.isEmpty {
                perfil.horarios = DiaHorario.semanaPorDefecto()
            }
        }
        isLoading = false
    }

    private func usarUbicacionActual() {
        let manager = LocationManager.shared
        manager.solicitarPermiso()
        if let ubicacion = manager.ubicacion {
            perfil.latitud = ubicacion.coordinate.latitude
            perfil.longitud = ubicacion.coordinate.longitude
            usoMiUbicacion = true
        } else {
            Task {
                try? await Task.sleep(for: .seconds(2))
                if let ubicacion = manager.ubicacion {
                    perfil.latitud = ubicacion.coordinate.latitude
                    perfil.longitud = ubicacion.coordinate.longitude
                    usoMiUbicacion = true
                } else {
                    mensajeError = "No se pudo obtener tu ubicación. Revisá el permiso en Ajustes."
                }
            }
        }
    }

    private func guardar() async {
        guard !perfil.nombre.isEmpty else {
            mensajeError = "El nombre del negocio no puede estar vacío."
            return
        }
        isSaving = true
        mensajeError = nil
        do {
            try await appState.actualizarPerfil(perfil)
            dismiss()
        } catch {
            mensajeError = FirebaseService.mensajeAmigable(error)
        }
        isSaving = false
    }
}
