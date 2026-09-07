import SwiftUI

// MARK: - Paleta de colores (idéntica a la app Expo)

extension Color {
    /// Navy principal de marca (#1a2332)
    static let brand = Color(hex: "#1a2332")
    /// Menta de marca (#9dd9c1)
    static let mint = Color(hex: "#9dd9c1")
    /// Fondo general (#f9fafb)
    static let appBackground = Color(hex: "#f9fafb")
    /// Borde suave (#e5e7eb)
    static let appBorder = Color(hex: "#e5e7eb")
    /// Texto secundario (#6b7280)
    static let appSecondary = Color(hex: "#6b7280")
    /// Texto oscuro (#374151)
    static let appText = Color(hex: "#374151")
    /// WhatsApp (#25D366)
    static let whatsapp = Color(hex: "#25D366")
    /// Mail (#EA4335)
    static let mailRed = Color(hex: "#EA4335")
    /// Verde acento (#16a34a)
    static let accentGreen = Color(hex: "#16a34a")
    /// Ámbar acento (#f59e0b)
    static let accentAmber = Color(hex: "#f59e0b")
    /// Azul acento (#2563eb)
    static let accentBlue = Color(hex: "#2563eb")

    init(hex: String) {
        var value: UInt64 = 0
        var cleanHex = hex.trimmingCharacters(in: .alphanumerics.inverted)
        if cleanHex.hasPrefix("#") { cleanHex.removeFirst() }
        Scanner(string: cleanHex).scanHexInt64(&value)
        let red = Double((value >> 16) & 0xFF) / 255.0
        let green = Double((value >> 8) & 0xFF) / 255.0
        let blue = Double(value & 0xFF) / 255.0
        self.init(red: red, green: green, blue: blue)
    }
}

/// Permite usar los colores con sintaxis de punto en contextos ShapeStyle
/// (por ejemplo `.foregroundStyle(.appText)`).
extension ShapeStyle where Self == Color {
    static var brand: Color { Color(hex: "#1a2332") }
    static var mint: Color { Color(hex: "#9dd9c1") }
    static var appBackground: Color { Color(hex: "#f9fafb") }
    static var appBorder: Color { Color(hex: "#e5e7eb") }
    static var appSecondary: Color { Color(hex: "#6b7280") }
    static var appText: Color { Color(hex: "#374151") }
    static var whatsapp: Color { Color(hex: "#25D366") }
    static var mailRed: Color { Color(hex: "#EA4335") }
    static var accentGreen: Color { Color(hex: "#16a34a") }
    static var accentAmber: Color { Color(hex: "#f59e0b") }
    static var accentBlue: Color { Color(hex: "#2563eb") }
}

// MARK: - Componentes reutilizables

struct BrandButton: View {
    let title: String
    var backgroundColor: Color = .brand
    var textColor: Color = .white
    var isLoading: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .tint(textColor)
                }
                Text(title)
                    .font(.system(size: 17, weight: .semibold))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .background(backgroundColor)
            .foregroundStyle(textColor)
            .clipShape(.rect(cornerRadius: 12))
        }
        .disabled(isLoading)
    }
}

struct StyledTextFieldStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(13)
            .background(Color(hex: "#f9fafb"))
            .clipShape(.rect(cornerRadius: 12))
            .overlay {
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color(hex: "#d1d5db"), lineWidth: 1)
            }
    }
}

extension View {
    func styledField() -> some View {
        modifier(StyledTextFieldStyle())
    }
}

struct SecurePasswordField: View {
    let placeholder: String
    @Binding var text: String
    @State private var isVisible = false

    var body: some View {
        HStack(spacing: 0) {
            Group {
                if isVisible {
                    TextField(placeholder, text: $text)
                        .textInputAutocapitalization(.never)
                } else {
                    SecureField(placeholder, text: $text)
                        .textInputAutocapitalization(.never)
                }
            }
            .padding(13)

            Button {
                isVisible.toggle()
            } label: {
                Image(systemName: isVisible ? "eye.slash" : "eye")
                    .foregroundStyle(.appSecondary)
                    .frame(width: 44, height: 44)
            }
        }
        .background(Color(hex: "#f9fafb"))
        .clipShape(.rect(cornerRadius: 12))
        .overlay {
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color(hex: "#d1d5db"), lineWidth: 1)
        }
    }
}

struct FieldLabel: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.system(size: 15, weight: .semibold))
            .foregroundStyle(.appText)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// Casilla de aceptación de términos con enlaces (igual que en Expo).
struct TermsCheckbox: View {
    @Binding var isAccepted: Bool
    var showValidation: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Toggle(isOn: $isAccepted) {
                HStack(spacing: 4) {
                    Text("He leído y acepto los")
                        .foregroundStyle(.appText)
                    NavigationLink {
                        TerminosView()
                    } label: {
                        Text("Términos y Condiciones")
                            .foregroundStyle(.brand)
                            .underline()
                    }
                    Text("y la")
                        .foregroundStyle(.appText)
                    NavigationLink {
                        PoliticaView()
                    } label: {
                        Text("Política de Privacidad")
                            .foregroundStyle(.brand)
                            .underline()
                    }
                }
                .font(.system(size: 13))
            }
            .toggleStyle(SwitchToggleStyle(tint: .mint))

            if showValidation && !isAccepted {
                Text("Debes aceptar los términos para registrarte")
                    .font(.system(size: 12))
                    .foregroundStyle(.red)
            }
        }
    }
}

/// Pie de página fijo con enlaces legales y contacto (igual que en Expo).
struct AppFooter: View {
    var body: some View {
        VStack(spacing: 8) {
            Divider()
                .overlay(Color.appBorder)
            HStack(spacing: 20) {
                NavigationLink {
                    TerminosView()
                } label: {
                    Text("Términos y Condiciones")
                        .font(.system(size: 12))
                        .foregroundStyle(.appSecondary)
                        .underline()
                }
                NavigationLink {
                    PoliticaView()
                } label: {
                    Text("Política de Privacidad")
                        .font(.system(size: 12))
                        .foregroundStyle(.appSecondary)
                        .underline()
                }
            }
            HStack(spacing: 24) {
                Link(destination: URL(string: "https://wa.me/5493756441056")!) {
                    Label("WhatsApp", systemImage: "message.fill")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.whatsapp)
                }
                Link(destination: URL(string: "mailto:info@al-toke.com")!) {
                    Label("info@al-toke.com", systemImage: "envelope.fill")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.mailRed)
                }
            }
            Text("Al Toke · v1.0")
                .font(.system(size: 11))
                .foregroundStyle(Color(hex: "#9ca3af"))
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 16)
        .frame(maxWidth: .infinity)
        .background(Color.white)
    }
}

struct LegalDocumentScreen: View {
    let title: String
    let paragraphs: [String]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                Text("Última actualización: 1 de diciembre de 2025")
                    .font(.system(size: 13))
                    .foregroundStyle(.appSecondary)
                ForEach(paragraphs, id: \.self) { paragraph in
                    Text(paragraph)
                        .font(.system(size: 14))
                        .foregroundStyle(.appText)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding(16)
        }
        .background(Color.white)
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct TerminosView: View {
    var body: some View {
        LegalDocumentScreen(
            title: "Términos y Condiciones",
            paragraphs: [
                "1. Objeto. Al Toke es una plataforma que conecta comercios y clientes locales para difundir ofertas y promociones. Al registrarte aceptás estas condiciones.",
                "2. Cuentas. Sos responsable de la información que brindás al registrarte y de mantener la confidencialidad de tu contraseña. Los comercios son responsables de la veracidad de las ofertas publicadas.",
                "3. Ofertas. Las ofertas tienen vigencia limitada según las fechas y horarios cargados por cada comercio. Al Toke no garantiza la disponibilidad de los productos ni la exactitud de los precios.",
                "4. Uso aceptable. Está prohibido publicar contenido ilegal, ofensivo, discriminatorio o material protegido por derechos de autor sin autorización. Las imágenes y videos son moderados.",
                "5. Contacto. Para consultas escribinos a info@al-toke.com o por WhatsApp al +54 9 3756 441 056.",
            ]
        )
    }
}

struct PoliticaView: View {
    var body: some View {
        LegalDocumentScreen(
            title: "Política de Privacidad",
            paragraphs: [
                "1. Datos que recopilamos. Recopilamos tu nombre, correo electrónico, número de teléfono y, en el caso de comercios, la información del negocio y sus ofertas.",
                "2. Uso de los datos. Usamos tus datos para operar la app, mostrarte comercios y ofertas cercanas, y gestionar tu cuenta. Tus datos se almacenan en Firebase (Google Cloud).",
                "3. Ubicación. Solicitamos tu ubicación únicamente para mostrarte comercios cercanos y calcular distancias. Podés revocar el permiso en cualquier momento desde Ajustes.",
                "4. Eliminación de cuenta. Podés eliminar tu cuenta y todos tus datos desde tu perfil, o solicitándolo a info@al-toke.com. Procesamos la solicitud en un plazo máximo de 30 días.",
                "5. Contacto. Ante cualquier duda sobre privacidad, escribinos a info@al-toke.com.",
            ]
        )
    }
}
