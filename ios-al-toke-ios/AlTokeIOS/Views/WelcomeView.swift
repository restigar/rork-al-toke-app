import SwiftUI

/// Pantalla de bienvenida con selección de rol y modal de inicio de sesión.
struct WelcomeView: View {
    @Environment(AppState.self) private var appState
    @State private var showLogin = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Spacer()

                // Logo
                VStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(.mint.opacity(0.25))
                            .frame(width: 110, height: 110)
                        Image(systemName: "bolt.fill")
                            .font(.system(size: 52))
                            .foregroundStyle(.brand)
                    }
                    Text("Al Toke")
                        .font(.system(size: 40, weight: .bold))
                        .foregroundStyle(.brand)
                    Text("Las mejores ofertas de tu barrio, al instante")
                        .font(.system(size: 17, weight: .medium))
                        .foregroundStyle(.appText)
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, 20)

                Spacer()

                // Botones de registro por rol
                HStack(spacing: 20) {
                    NavigationLink {
                        RegistroClienteView()
                    } label: {
                        VStack(spacing: 12) {
                            Image(systemName: "person.fill")
                                .font(.system(size: 40))
                            Text("Soy Cliente")
                                .font(.system(size: 18, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 34)
                        .background(Color(hex: "#9dd9c1"))
                        .clipShape(.rect(cornerRadius: 20))
                        .shadow(color: .black.opacity(0.3), radius: 8, x: 0, y: 4)
                    }
                    NavigationLink {
                        RegistroComercioView()
                    } label: {
                        VStack(spacing: 12) {
                            Image(systemName: "storefront.fill")
                                .font(.system(size: 40))
                            Text("Soy Comercio")
                                .font(.system(size: 18, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 34)
                        .background(Color.brand)
                        .clipShape(.rect(cornerRadius: 20))
                        .shadow(color: .black.opacity(0.3), radius: 8, x: 0, y: 4)
                    }
                }
                .padding(.horizontal, 20)

                Button {
                    showLogin = true
                } label: {
                    Label("Iniciar sesión", systemImage: "person.badge.key.fill")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 11)
                        .background(Color.brand)
                        .clipShape(.capsule)
                }
                .padding(.top, 28)

                Spacer(minLength: 12)

                AppFooter()
            }
            .background(Color.appBackground)
            .navigationBarHidden(true)
            .sheet(isPresented: $showLogin) {
                LoginSheet()
                    .presentationDetents([.medium, .large])
                    .presentationDragIndicator(.visible)
            }
        }
        .tint(.brand)
    }
}

/// Modal de inicio de sesión con email y contraseña.
struct LoginSheet: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var mensajeError: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    FieldLabel(text: "Email")
                    TextField("tu@email.com", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .styledField()

                    FieldLabel(text: "Contraseña")
                    SecurePasswordField(placeholder: "••••••••", text: $password)

                    if let mensajeError {
                        Text(mensajeError)
                            .font(.system(size: 13))
                            .foregroundStyle(.red)
                    }

                    BrandButton(title: "Iniciar sesión", isLoading: isLoading) {
                        Task { await iniciarSesion() }
                    }

                    Button("¿Olvidaste tu contraseña?") {
                        Task { await recuperarContrasena() }
                    }
                    .font(.system(size: 14))
                    .foregroundStyle(.brand)
                    .frame(maxWidth: .infinity)
                }
                .padding(20)
            }
            .background(Color.white)
            .navigationTitle("Iniciar sesión")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cerrar") { dismiss() }
                }
            }
        }
    }

    private func iniciarSesion() async {
        guard !email.isEmpty, !password.isEmpty else {
            mensajeError = "Completá email y contraseña."
            return
        }
        isLoading = true
        mensajeError = nil
        do {
            try await appState.iniciarSesion(email: email, password: password)
            dismiss()
        } catch {
            mensajeError = FirebaseService.mensajeAmigable(error)
        }
        isLoading = false
    }

    private func recuperarContrasena() async {
        guard !email.isEmpty else {
            mensajeError = "Ingresá tu email para recuperar la contraseña."
            return
        }
        do {
            try await FirebaseService.resetPassword(email: email)
            mensajeError = nil
        } catch {
            mensajeError = FirebaseService.mensajeAmigable(error)
        }
    }
}
