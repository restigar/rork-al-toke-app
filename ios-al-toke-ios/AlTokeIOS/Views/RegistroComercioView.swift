import SwiftUI

/// Registro de comercio: cuenta de Auth + documento en /users (role: "Comercio").
struct RegistroComercioView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var nombreComercio = ""
    @State private var tipo = "Comercio"
    @State private var rubro = ""
    @State private var subRubro = ""
    @State private var nombreResponsable = ""
    @State private var telefono = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var acceptedTerms = false
    @State private var showValidation = false
    @State private var isLoading = false
    @State private var mensajeError: String?
    @State private var registroExitoso = false

    private var categoriasDisponibles: [String] { Rubros.categorias(tipo: tipo) }
    private var subRubrosDisponibles: [String] { Rubros.subRubros(tipo: tipo, rubro: rubro) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                FieldLabel(text: "Nombre del negocio")
                TextField("Mi Negocio", text: $nombreComercio)
                    .styledField()

                FieldLabel(text: "Tipo")
                Picker("Tipo", selection: $tipo) {
                    ForEach(Rubros.tipos, id: \.self) { Text($0).tag($0) }
                }
                .pickerStyle(.segmented)
                .onChange(of: tipo) {
                    rubro = ""
                    subRubro = ""
                }

                if tipo == "Comercio" {
                    FieldLabel(text: "Rubro")
                    Picker("Rubro", selection: $rubro) {
                        Text("Seleccionar rubro").tag("")
                        ForEach(categoriasDisponibles, id: \.self) { Text($0).tag($0) }
                    }
                    .styledField()
                    .onChange(of: rubro) { subRubro = "" }

                    FieldLabel(text: "Subrubro")
                    Picker("Subrubro", selection: $subRubro) {
                        Text("Seleccionar subrubro").tag("")
                        ForEach(subRubrosDisponibles, id: \.self) { Text($0).tag($0) }
                    }
                    .styledField()
                    .disabled(rubro.isEmpty)
                } else {
                    FieldLabel(text: tipo == "Servicio" ? "Servicio" : "Área")
                    Picker("Subrubro", selection: $subRubro) {
                        Text("Seleccionar").tag("")
                        ForEach(subRubrosDisponibles, id: \.self) { Text($0).tag($0) }
                    }
                    .styledField()
                    .onChange(of: subRubro) { rubro = tipo == "Servicio" ? "Servicios" : "Organización" }
                }

                FieldLabel(text: "Nombre y apellido del responsable")
                TextField("Juan Pérez", text: $nombreResponsable)
                    .styledField()

                FieldLabel(text: "Teléfono")
                TextField("+54 9 ...", text: $telefono)
                    .keyboardType(.phonePad)
                    .styledField()

                FieldLabel(text: "Email")
                TextField("negocio@email.com", text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .styledField()

                FieldLabel(text: "Contraseña")
                SecurePasswordField(placeholder: "Mínimo 6 caracteres", text: $password)

                FieldLabel(text: "Confirmar contraseña")
                SecurePasswordField(placeholder: "Repetí tu contraseña", text: $confirmPassword)

                TermsCheckbox(isAccepted: $acceptedTerms, showValidation: showValidation)

                if let mensajeError {
                    Text(mensajeError)
                        .font(.system(size: 13))
                        .foregroundStyle(.red)
                }

                BrandButton(title: "Registrar mi comercio", backgroundColor: .brand, isLoading: isLoading) {
                    Task { await registrarse() }
                }
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .navigationTitle("Registro Comercio")
        .navigationBarTitleDisplayMode(.inline)
        .tint(.brand)
        .alert("¡Registro exitoso!", isPresented: $registroExitoso) {
            Button("OK") { dismiss() }
        } message: {
            Text("Tu comercio fue registrado correctamente. ¡Bienvenido a Al Toke!")
        }
    }

    private func registrarse() async {
        showValidation = true
        guard !nombreComercio.isEmpty else {
            mensajeError = "Ingresá el nombre del negocio."
            return
        }
        guard !subRubro.isEmpty else {
            mensajeError = "Seleccioná el rubro y subrubro."
            return
        }
        guard !nombreResponsable.isEmpty else {
            mensajeError = "Ingresá el nombre del responsable."
            return
        }
        guard !email.isEmpty else {
            mensajeError = "Ingresá tu email."
            return
        }
        guard password.count >= 6 else {
            mensajeError = "La contraseña debe tener al menos 6 caracteres."
            return
        }
        guard password == confirmPassword else {
            mensajeError = "Las contraseñas no coinciden."
            return
        }
        guard acceptedTerms else {
            mensajeError = nil
            return
        }

        isLoading = true
        mensajeError = nil
        do {
            try await appState.registrar(role: .comercio, email: email, password: password) { uid, numero in
                UserProfile(
                    id: uid,
                    name: nombreResponsable.trimmingCharacters(in: .whitespaces),
                    email: email,
                    role: UserRole.comercio.rawValue,
                    type: "comercio",
                    phone: telefono.isEmpty ? "N/A" : telefono,
                    numeroComercio: numero,
                    nombre: nombreComercio.trimmingCharacters(in: .whitespaces),
                    tipoNegocio: tipo,
                    rubro: rubro,
                    subRubro: subRubro,
                    horarios: DiaHorario.semanaPorDefecto()
                )
            }
            isLoading = false
            registroExitoso = true
        } catch {
            isLoading = false
            mensajeError = FirebaseService.mensajeAmigable(error)
        }
    }
}
