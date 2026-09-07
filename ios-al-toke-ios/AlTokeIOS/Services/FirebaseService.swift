import Foundation
import FirebaseAuth
import FirebaseFirestore
import FirebaseStorage
import FirebaseCore

/// Capa de servicios de Firebase: configuración, autenticación y Firestore.
/// Se conecta al mismo proyecto Firebase que la app Expo (studio-8462520778-609ca).
enum FirebaseService {
    private static let collectionUsuarios = "users"
    private static let collectionOfertas = "ofertas"
    private static let collectionContadores = "counters"

    private static var db: Firestore { Firestore.firestore() }

    // MARK: - Configuración (valores de GoogleService-Info.plist del proyecto)

    static func configure() {
        guard FirebaseApp.app() == nil else { return }
        let options = FirebaseOptions(
            googleAppID: "1:770675581016:ios:b20e00e60c370d8ea82a2d",
            gcmSenderID: "770675581016"
        )
        options.apiKey = "AIzaSyAHsYJRdrIMsz3c2Fq34jcxQp4nQRtRlzI"
        options.projectID = "studio-8462520778-609ca"
        options.databaseURL = "https://studio-8462520778-609ca-default-rtdb.firebaseio.com"
        options.storageBucket = "studio-8462520778-609ca.firebasestorage.app"
        FirebaseApp.configure(options: options)
        // Firestore online directo: la caché offline queda activa por defecto,
        // pero garantizamos que las escrituras se encolen y sincronicen.
        let settings = FirestoreSettings()
        settings.cacheSettings = PersistentCacheSettings()
        Firestore.firestore().settings = settings
    }

    // MARK: - Autenticación

    static var usuarioActual: User? { Auth.auth().currentUser }

    static func signUp(email: String, password: String) async throws -> User {
        try await Auth.auth().createUser(withEmail: email, password: password).user
    }

    static func signIn(email: String, password: String) async throws -> User {
        try await Auth.auth().signIn(withEmail: email, password: password).user
    }

    static func signOut() throws {
        try Auth.auth().signOut()
    }

    static func resetPassword(email: String) async throws {
        try await Auth.auth().sendPasswordReset(withEmail: email)
    }

    /// Elimina la cuenta de autenticación y todos los documentos asociados.
    static func deleteAccount(userId: String) async throws {
        let batch = db.batch()
        let ofertas = try await db.collection(collectionOfertas)
            .whereField("comercioId", isEqualTo: userId)
            .getDocuments()
        for document in ofertas.documents {
            batch.deleteDocument(document.reference)
        }
        batch.deleteDocument(db.collection(collectionUsuarios).document(userId))
        try await batch.commit()
        try await Auth.auth().currentUser?.delete()
    }

    // MARK: - Perfiles (colección users)

    /// Obtiene el perfil del usuario desde Firestore.
    static func fetchPerfil(userId: String) async throws -> UserProfile? {
        let snapshot = try await db.collection(collectionUsuarios).document(userId).getDocument()
        guard snapshot.exists, let data = snapshot.data() else { return nil }
        return UserProfile(id: snapshot.documentID, dictionary: data)
    }

    /// Obtiene todos los comercios activos (users donde role == "Comercio").
    static func fetchComercios() async throws -> [UserProfile] {
        let snapshot = try await db.collection(collectionUsuarios)
            .whereField("role", isEqualTo: UserRole.comercio.rawValue)
            .getDocuments()
        return snapshot.documents
            .compactMap { UserProfile(id: $0.documentID, dictionary: $0.data()) }
            .filter { $0.status == "Activo" }
            .sorted { $0.nombreMostrado.localizedCaseInsensitiveCompare($1.nombreMostrado) == .orderedAscending }
    }

    /// Guarda (crea o actualiza) el perfil del usuario.
    static func savePerfil(_ perfil: UserProfile) async throws {
        try await db.collection(collectionUsuarios).document(perfil.id)
            .setData(perfil.dictionary, merge: true)
    }

    /// Número secuencial compartido (compatible con la app Expo y el panel admin).
    static func siguienteNumero(role: UserRole) async throws -> String {
        let documentId = role == .cliente ? "clientes" : "comercios"
        let reference = db.collection(collectionContadores).document(documentId)
        let value = try await db.runTransaction { transaction, _ -> Any? in
            guard let snapshot = try? transaction.getDocument(reference),
                  let current = snapshot.data()?["value"] as? Int64 else {
                transaction.setData(["value": 1], forDocument: reference, merge: true)
                return 1
            }
            let next = current + 1
            transaction.setData(["value": next], forDocument: reference, merge: true)
            return next
        }
        return String((value as? Int64) ?? 1)
    }

    // MARK: - Ofertas (colección ofertas)

    /// Guarda una oferta (creación o edición).
    static func saveOferta(_ oferta: Oferta) async throws {
        try await db.collection(collectionOfertas).document(oferta.id)
            .setData(oferta.dictionary, merge: true)
    }

    /// Ofertas activas (vigentes ahora) de un comercio.
    static func fetchOfertas(comercioId: String) async throws -> [Oferta] {
        let snapshot = try await db.collection(collectionOfertas)
            .whereField("comercioId", isEqualTo: comercioId)
            .getDocuments()
        return snapshot.documents
            .compactMap { Oferta(id: $0.documentID, dictionary: $0.data()) }
            .sorted { $0.vigenciaInicio < $1.vigenciaInicio }
    }

    /// Ofertas vigentes de todos los comercios, para la vista de cliente.
    static func fetchOfertasVigentes() async throws -> [Oferta] {
        let snapshot = try await db.collection(collectionOfertas).getDocuments()
        return snapshot.documents
            .compactMap { Oferta(id: $0.documentID, dictionary: $0.data()) }
            .filter { $0.estaVigente() }
            .sorted { $0.vigenciaInicio > $1.vigenciaInicio }
    }

    static func deleteOferta(id: String) async throws {
        try await db.collection(collectionOfertas).document(id).delete()
    }

    // MARK: - Storage (fotos de perfil e imágenes de ofertas)

    static func subirImagen(data: Data, path: String) async throws -> String {
        let reference = Storage.storage().reference().child(path)
        let metadata = StorageMetadata()
        metadata.contentType = "image/jpeg"
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<StorageMetadata?, Error>) in
            reference.putData(data, metadata: metadata) { _, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: metadata)
                }
            }
        }
        return try await reference.downloadURL().absoluteString
    }

    // MARK: - Mensajes de error amigables

    static func mensajeAmigable(_ error: Error) -> String {
        let nsError = error as NSError
        if nsError.domain == FirestoreErrorDomain, nsError.code == FirestoreErrorCode.unavailable.rawValue {
            return "Sin conexión a internet. Por favor verifica tu conexión."
        }
        if nsError.domain == AuthErrorDomain {
            switch AuthErrorCode(rawValue: nsError.code) {
            case .emailAlreadyInUse:
                return "El email ya está registrado."
            case .invalidEmail:
                return "El email no es válido."
            case .weakPassword:
                return "La contraseña es demasiado débil (mínimo 6 caracteres)."
            case .wrongPassword, .invalidCredential:
                return "Email o contraseña incorrectos."
            case .userNotFound:
                return "No existe una cuenta con ese email."
            case .tooManyRequests:
                return "Demasiados intentos. Probá de nuevo más tarde."
            case .networkError:
                return "Sin conexión a internet. Por favor verifica tu conexión."
            default:
                break
            }
        }
        return nsError.localizedDescription
    }
}

// MARK: - Utilidades de fecha y distancia

enum FechaHelper {
    /// Combina una fecha con una hora "HH:mm".
    static func fecha(_ dia: Date, hora: String, finDelDia: Bool = false) -> Date {
        let calendar = Calendar.current
        var componentes = calendar.dateComponents([.year, .month, .day], from: dia)
        if let partes = hora.split(separator: ":").compactMap({ Int($0) }) as [Int]?, partes.count == 2 {
            componentes.hour = partes[0]
            componentes.minute = partes[1]
            componentes.second = finDelDia ? 59 : 0
        } else {
            componentes.hour = finDelDia ? 23 : 0
            componentes.minute = finDelDia ? 59 : 0
            componentes.second = finDelDia ? 59 : 0
        }
        return calendar.date(from: componentes) ?? dia
    }

    /// Misma lógica que cargar-oferta.tsx: la oferta inicia en el horario de apertura
    /// del comercio ese día y finaliza en el horario de cierre de ese día.
    static func horarioApertura(horarios: [DiaHorario], fecha: Date) -> String {
        guard !horarios.isEmpty else { return "00:00" }
        let nombreDia = nombreDiaSemana(fecha)
        guard let horario = horarios.first(where: { $0.dia == nombreDia }), horario.abierto else {
            return "00:00"
        }
        return horario.mananaInicio
    }

    static func horarioCierre(horarios: [DiaHorario], fecha: Date) -> String {
        guard !horarios.isEmpty else { return "23:59" }
        let nombreDia = nombreDiaSemana(fecha)
        guard let horario = horarios.first(where: { $0.dia == nombreDia }), horario.abierto else {
            return "23:59"
        }
        return horario.horarioCorrido ? horario.mananaFin : (horario.tardeFin.isEmpty ? horario.mananaFin : horario.tardeFin)
    }

    static func nombreDiaSemana(_ date: Date) -> String {
        let index = Calendar.current.component(.weekday, from: date)
        // weekday: 1 = domingo ... 7 = sábado
        let dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
        return dias[index - 1]
    }

    static func formatear(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "es_AR")
        formatter.dateFormat = "dd/MM/yyyy"
        return formatter.string(from: date)
    }

    static func formatearCompleto(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "es_AR")
        formatter.dateFormat = "dd/MM/yyyy HH:mm"
        return formatter.string(from: date)
    }

    /// Distancia Haversine en kilómetros (misma fórmula que Expo).
    static func distanciaKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double) -> Double {
        let radio = 6371.0
        let dLat = (lat2 - lat1) * Double.pi / 180
        let dLon = (lon2 - lon1) * Double.pi / 180
        let a = sin(dLat / 2) * sin(dLat / 2)
            + cos(lat1 * Double.pi / 180) * cos(lat2 * Double.pi / 180)
            * sin(dLon / 2) * sin(dLon / 2)
        return radio * 2 * atan2(sqrt(a), sqrt(1 - a))
    }
}
