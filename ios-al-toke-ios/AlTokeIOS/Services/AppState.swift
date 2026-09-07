import Foundation
import FirebaseAuth
import CoreLocation

/// Estado global de sesión: sincroniza Firebase Auth con el perfil en Firestore.
@Observable
final class AppState {
    static let shared = AppState()

    private(set) var perfil: UserProfile?
    private(set) var isLoading = true

    var isLoggedIn: Bool { perfil != nil }

    private init() {}

    /// Restaura la sesión activa de Firebase al arrancar la app.
    func restaurarSesion() async {
        isLoading = true
        defer { isLoading = false }
        guard let usuario = FirebaseService.usuarioActual else {
            perfil = nil
            return
        }
        do {
            perfil = try await FirebaseService.fetchPerfil(userId: usuario.uid)
        } catch {
            print("⚠️ [AppState] No se pudo sincronizar el perfil: \(error.localizedDescription)")
            perfil = nil
        }
    }

    /// Registra un nuevo cliente o comercio: cuenta de Auth + documento en /users
    /// (uid de Auth como ID del documento, igual que exige el panel admin).
    func registrar(role: UserRole, email: String, password: String,
                   armarPerfil: @MainActor (String, String) -> UserProfile) async throws {
        let usuario = try await FirebaseService.signUp(email: email, password: password)
        let numero = try await FirebaseService.siguienteNumero(role: role)
        let nuevoPerfil = armarPerfil(usuario.uid, numero)
        try await FirebaseService.savePerfil(nuevoPerfil)
        perfil = nuevoPerfil
    }

    func iniciarSesion(email: String, password: String) async throws {
        let usuario = try await FirebaseService.signIn(email: email, password: password)
        guard let perfilCargado = try await FirebaseService.fetchPerfil(userId: usuario.uid) else {
            try? FirebaseService.signOut()
            throw AppError.perfilNoEncontrado
        }
        perfil = perfilCargado
    }

    func cerrarSesion() throws {
        try FirebaseService.signOut()
        perfil = nil
    }

    func actualizarPerfil(_ nuevoPerfil: UserProfile) async throws {
        try await FirebaseService.savePerfil(nuevoPerfil)
        perfil = nuevoPerfil
    }

    func eliminarCuenta() async throws {
        guard let perfil else { return }
        try await FirebaseService.deleteAccount(userId: perfil.id)
        self.perfil = nil
    }

    func recargarPerfil() async {
        guard let usuario = FirebaseService.usuarioActual else { return }
        perfil = try? await FirebaseService.fetchPerfil(userId: usuario.uid)
    }
}

enum AppError: LocalizedError {
    case perfilNoEncontrado

    var errorDescription: String? {
        switch self {
        case .perfilNoEncontrado:
            return "No se encontró una cuenta asociada. Por favor regístrate primero."
        }
    }
}

/// Administrador de ubicación para calcular distancias de comercios.
@Observable
final class LocationManager: NSObject, CLLocationManagerDelegate {
    static let shared = LocationManager()

    private let manager = CLLocationManager()
    private(set) var ubicacion: CLLocation?
    private(set) var permisoDenegado = false

    override private init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }

    func solicitarPermiso() {
        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            manager.requestLocation()
        default:
            permisoDenegado = true
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        Task { @MainActor in
            self.ubicacion = locations.last
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("⚠️ [LocationManager] \(error.localizedDescription)")
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            switch manager.authorizationStatus {
            case .authorizedWhenInUse, .authorizedAlways:
                self.permisoDenegado = false
                self.manager.requestLocation()
            case .denied, .restricted:
                self.permisoDenegado = true
            default:
                break
            }
        }
    }
}
