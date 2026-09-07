import SwiftUI
import FirebaseAuth

/// Registro de cliente: cuenta de Auth + documento en /users (role: "Cliente").
struct RegistroClienteView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var acceptedTerms = false
    @State private var showValidation = false
    @State private var isLoading = false
    @State private var mensajeError: String?
    @State private var registroExitoso = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                FieldLabel(text: "Nombre")
                TextField("Juan", text: $firstName)
                    .styledField()

                FieldLabel(text: "Apellido")
                TextField("Pérez", text: $lastName)
                    .styledField()

                FieldLabel(text: "Email")
                TextField("tu@email.com", text: $email)
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

                BrandButton(title: "Registrarme", backgroundColor: .mint, isLoading: isLoading) {
                    Task { await registrarse() }
                }
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .navigationTitle("Registro Cliente")
        .navigationBarTitleDisplayMode(.inline)
        .tint(.brand)
        .alert("¡Registro exitoso!", isPresented: $registroExitoso) {
            Button("OK") { dismiss() }
        } message: {
            Text("Tu cuenta fue creada correctamente. ¡Bienvenido a Al Toke!")
        }
    }

    private func registrarse() async {
        showValidation = true
        guard !firstName.isEmpty, !lastName.isEmpty else {
            mensajeError = "Ingresá tu nombre y apellido."
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
            try await appState.registrar(role: .cliente, email: email, password: password) { uid, numero in
                UserProfile(
                    id: uid,
                    name: "\(firstName) \(lastName)".trimmingCharacters(in: .whitespaces),
                    email: email,
                    role: UserRole.cliente.rawValue,
                    type: "cliente",
                    numeroCliente: numero
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
