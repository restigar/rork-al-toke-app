import Foundation

// MARK: - Modelos de datos (espejo exacto del esquema Firestore de la app Expo)

enum UserRole: String {
    case cliente = "Cliente"
    case comercio = "Comercio"
}

/// Horario de un día de la semana (colección users → campo horarios).
struct DiaHorario: Identifiable, Equatable {
    let id = UUID()
    var dia: String
    var abierto: Bool
    var horarioCorrido: Bool
    var mananaInicio: String
    var mananaFin: String
    var tardeInicio: String
    var tardeFin: String

    static let diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

    static func semanaPorDefecto() -> [DiaHorario] {
        diasSemana.map { dia in
            DiaHorario(dia: dia, abierto: dia != "Domingo", horarioCorrido: false,
                       mananaInicio: "08:00", mananaFin: "12:30",
                       tardeInicio: "16:00", tardeFin: "21:00")
        }
    }

    var manana: (inicio: String, fin: String)? {
        abierto ? (mananaInicio, mananaFin) : nil
    }

    var tarde: (inicio: String, fin: String)? {
        (!horarioCorrido && abierto) ? (tardeInicio, tardeFin) : nil
    }

    init(dia: String, abierto: Bool, horarioCorrido: Bool,
         mananaInicio: String, mananaFin: String, tardeInicio: String, tardeFin: String) {
        self.dia = dia
        self.abierto = abierto
        self.horarioCorrido = horarioCorrido
        self.mananaInicio = mananaInicio
        self.mananaFin = mananaFin
        self.tardeInicio = tardeInicio
        self.tardeFin = tardeFin
    }

    init?(dictionary: [String: Any]) {
        guard let dia = dictionary["dia"] as? String else { return nil }
        self.dia = dia
        self.abierto = dictionary["abierto"] as? Bool ?? false
        self.horarioCorrido = dictionary["horarioCorrido"] as? Bool ?? false
        if let manana = dictionary["manana"] as? [String: Any] {
            mananaInicio = manana["inicio"] as? String ?? "08:00"
            mananaFin = manana["fin"] as? String ?? "12:30"
        } else {
            mananaInicio = "08:00"
            mananaFin = "12:30"
        }
        if let tarde = dictionary["tarde"] as? [String: Any] {
            tardeInicio = tarde["inicio"] as? String ?? "16:00"
            tardeFin = tarde["fin"] as? String ?? "21:00"
        } else {
            tardeInicio = "16:00"
            tardeFin = "21:00"
        }
    }

    var dictionary: [String: Any] {
        var value: [String: Any] = [
            "dia": dia,
            "abierto": abierto,
            "horarioCorrido": horarioCorrido,
        ]
        if abierto {
            value["manana"] = ["inicio": mananaInicio, "fin": mananaFin]
            if !horarioCorrido {
                value["tarde"] = ["inicio": tardeInicio, "fin": tardeFin]
            }
        }
        return value
    }

    /// Indica si el comercio está abierto a una fecha/hora dada (misma lógica que Expo).
    func estaAbierto(a date: Date = .init()) -> Bool {
        guard abierto else { return false }
        let calendar = Calendar.current
        let minutosActuales = calendar.component(.hour, from: date) * 60 + calendar.component(.minute, from: date)

        func minutos(_ hora: String) -> Int {
            let partes = hora.split(separator: ":").compactMap { Int($0) }
            guard partes.count == 2 else { return 0 }
            return partes[0] * 60 + partes[1]
        }

        if minutosActuales >= minutos(mananaInicio) && minutosActuales <= minutos(mananaFin) {
            return true
        }
        if !horarioCorrido, minutosActuales >= minutos(tardeInicio), minutosActuales <= minutos(tardeFin) {
            return true
        }
        return false
    }
}

/// Perfil de usuario: documento de la colección `users` (clientes y comercios).
struct UserProfile: Identifiable, Equatable {
    var id: String
    var name: String
    var email: String
    var role: String            // "Cliente" | "Comercio"
    var status: String          // "Activo"
    var type: String            // "cliente" | "comercio" (compatibilidad con Expo)
    var phone: String
    var city: String
    var os: String
    var numeroCliente: String
    var numeroComercio: String
    var nombre: String          // nombre del comercio
    var tipoNegocio: String     // "Comercio" | "Servicio" | "Organización Pública"
    var rubro: String
    var subRubro: String
    var fotoPerfil: String
    var facebook: String
    var instagram: String
    var website: String
    var latitud: Double
    var longitud: Double
    var calle: String
    var ciudad: String
    var horarios: [DiaHorario]

    var esCliente: Bool { type == "cliente" || role == UserRole.cliente.rawValue }
    var esComercio: Bool { type == "comercio" || role == UserRole.comercio.rawValue }

    var nombreMostrado: String {
        esComercio ? (nombre.isEmpty ? name : nombre) : name
    }

    var numeroMostrado: String {
        esComercio ? numeroComercio : numeroCliente
    }

    init(id: String, name: String, email: String, role: String, status: String = "Activo",
         type: String, phone: String = "N/A", city: String = "N/A", os: String = "iOS",
         numeroCliente: String = "", numeroComercio: String = "", nombre: String = "",
         tipoNegocio: String = "Comercio", rubro: String = "", subRubro: String = "",
         fotoPerfil: String = "", facebook: String = "", instagram: String = "",
         website: String = "", latitud: Double = 0, longitud: Double = 0,
         calle: String = "", ciudad: String = "", horarios: [DiaHorario] = []) {
        self.id = id
        self.name = name
        self.email = email
        self.role = role
        self.status = status
        self.type = type
        self.phone = phone
        self.city = city
        self.os = os
        self.numeroCliente = numeroCliente
        self.numeroComercio = numeroComercio
        self.nombre = nombre
        self.tipoNegocio = tipoNegocio
        self.rubro = rubro
        self.subRubro = subRubro
        self.fotoPerfil = fotoPerfil
        self.facebook = facebook
        self.instagram = instagram
        self.website = website
        self.latitud = latitud
        self.longitud = longitud
        self.calle = calle
        self.ciudad = ciudad
        self.horarios = horarios
    }

    init?(id: String, dictionary: [String: Any]) {
        guard let email = dictionary["email"] as? String else { return nil }
        let role = dictionary["role"] as? String ?? "Cliente"
        self.id = id
        self.email = email
        self.role = role
        self.name = dictionary["name"] as? String ?? ""
        self.status = dictionary["status"] as? String ?? "Activo"
        self.type = dictionary["type"] as? String ?? (role == "Comercio" ? "comercio" : "cliente")
        self.phone = dictionary["phone"] as? String ?? "N/A"
        self.city = dictionary["city"] as? String ?? "N/A"
        self.os = dictionary["os"] as? String ?? "iOS"
        self.numeroCliente = dictionary["numeroCliente"] as? String ?? ""
        self.numeroComercio = dictionary["numeroComercio"] as? String ?? ""
        self.nombre = dictionary["nombre"] as? String ?? ""
        self.tipoNegocio = dictionary["tipo"] as? String ?? "Comercio"
        self.rubro = dictionary["rubro"] as? String ?? ""
        self.subRubro = dictionary["subRubro"] as? String ?? ""
        self.fotoPerfil = dictionary["fotoPerfil"] as? String ?? ""
        self.facebook = dictionary["facebook"] as? String ?? ""
        self.instagram = dictionary["instagram"] as? String ?? ""
        self.website = dictionary["website"] as? String ?? ""
        if let ubicacion = dictionary["ubicacion"] as? [String: Any] {
            self.latitud = ubicacion["latitud"] as? Double ?? 0
            self.longitud = ubicacion["longitud"] as? Double ?? 0
            self.calle = ubicacion["calle"] as? String ?? ""
            self.ciudad = ubicacion["ciudad"] as? String ?? ""
        } else {
            self.latitud = 0
            self.longitud = 0
            self.calle = ""
            self.ciudad = ""
        }
        self.horarios = (dictionary["horarios"] as? [[String: Any]] ?? [])
            .compactMap { DiaHorario(dictionary: $0) }
    }

    var dictionary: [String: Any] {
        var value: [String: Any] = [
            "name": name,
            "email": email,
            "role": role,
            "status": status,
            "type": type,
            "phone": phone,
            "city": city,
            "os": os,
        ]
        if esComercio {
            value["numeroComercio"] = numeroComercio
            value["nombre"] = nombre
            value["tipo"] = tipoNegocio
            value["rubro"] = rubro
            value["subRubro"] = subRubro
            value["facebook"] = facebook
            value["instagram"] = instagram
            value["website"] = website
            value["ubicacion"] = [
                "latitud": latitud,
                "longitud": longitud,
                "calle": calle,
                "ciudad": ciudad,
            ]
            value["horarios"] = horarios.map(\.dictionary)
        } else {
            value["numeroCliente"] = numeroCliente
        }
        if !fotoPerfil.isEmpty {
            value["fotoPerfil"] = fotoPerfil
        }
        return value
    }
}

/// Oferta: documento de la colección `ofertas`.
struct Oferta: Identifiable, Equatable {
    var id: String
    var comercioId: String
    var comercioNombre: String
    var titulo: String
    var descripcion: String
    var precio: Double
    var vigenciaInicio: Date
    var vigenciaFin: Date
    var imagenUrl: String

    /// La oferta solo está activa dentro de su ventana de vigencia.
    func estaVigente(now: Date = .init()) -> Bool {
        now >= vigenciaInicio && now <= vigenciaFin
    }

    /// Aún no comenzó.
    func esProxima(now: Date = .init()) -> Bool {
        now < vigenciaInicio
    }

    init(id: String, comercioId: String, comercioNombre: String, titulo: String,
         descripcion: String, precio: Double, vigenciaInicio: Date, vigenciaFin: Date,
         imagenUrl: String = "") {
        self.id = id
        self.comercioId = comercioId
        self.comercioNombre = comercioNombre
        self.titulo = titulo
        self.descripcion = descripcion
        self.precio = precio
        self.vigenciaInicio = vigenciaInicio
        self.vigenciaFin = vigenciaFin
        self.imagenUrl = imagenUrl
    }

    /// Formato ISO compatible con la app Expo (new Date(...).toISOString()).
    private static let isoFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let isoFormatterNoFraction = ISO8601DateFormatter()

    static func parseISO(_ value: String) -> Date? {
        isoFormatter.date(from: value) ?? isoFormatterNoFraction.date(from: value)
    }

    static func toISO(_ date: Date) -> String {
        isoFormatter.string(from: date)
    }

    init?(id: String, dictionary: [String: Any]) {
        guard let titulo = dictionary["titulo"] as? String,
              let inicioString = dictionary["vigenciaInicio"] as? String,
              let inicio = Oferta.parseISO(inicioString),
              let finString = dictionary["vigenciaFin"] as? String,
              let fin = Oferta.parseISO(finString)
        else { return nil }
        self.id = id
        self.titulo = titulo
        self.descripcion = dictionary["descripcion"] as? String ?? ""
        self.comercioId = dictionary["comercioId"] as? String ?? ""
        self.comercioNombre = dictionary["comercioNombre"] as? String ?? ""
        self.precio = dictionary["precio"] as? Double ?? 0
        self.vigenciaInicio = inicio
        self.vigenciaFin = fin
        self.imagenUrl = dictionary["imagenUrl"] as? String ?? ""
    }

    var dictionary: [String: Any] {
        [
            "comercioId": comercioId,
            "comercioNombre": comercioNombre,
            "titulo": titulo,
            "descripcion": descripcion,
            "precio": precio,
            "vigenciaInicio": Oferta.toISO(vigenciaInicio),
            "vigenciaFin": Oferta.toISO(vigenciaFin),
            "imagenUrl": imagenUrl,
        ]
    }
}

// MARK: - Rubros (idénticos a constants/businessData.ts)

enum Rubros {
    static let comercios: [(categoria: String, subRubros: [String])] = [
        ("Alimentación y Gastronomía", ["Restaurante", "Cafetería", "Bar", "Panadería y Pastelería", "Supermercado", "Almacén", "Verdulería y Frutería", "Carnicería", "Dietética"]),
        ("Salud y Cuidado Personal", ["Farmacia", "Consultorio Médico", "Consultorio Odontológico", "Peluquería y Barbería", "Centro de Estética", "Gimnasio", "Óptica"]),
        ("Comercio Minorista General", ["Indumentaria", "Calzado", "Librería", "Juguetería", "Ferretería", "Tienda de Mascotas", "Electrónica", "Artículos para el Hogar"]),
        ("Servicios de Mantenimiento", ["Plomería", "Electricidad", "Cerrajería", "Servicio Técnico de PC", "Reparación de Celulares", "Lavadero de Autos"]),
        ("Bienes Raíces y Vehículos", ["Inmobiliaria", "Concesionaria de Autos", "Alquiler de Autos", "Mecánica Automotriz"]),
        ("Ocio y Entretenimiento", ["Cine", "Teatro", "Centro Cultural", "Agencia de Turismo", "Salón de Fiestas"]),
    ]
    static let servicios = ["Electricista", "Plomero (Fontanero) y Gasista", "Albañil y Constructor", "Carpintero", "Herrero", "Mecánico Automotriz", "Gomero (Vulcanizador)", "Chapista y Pintor", "Esteticista Personal", "Masajista y Fisioterapeuta", "Servicios Gastronómicos (Cocinero/Camarero)", "Panadero/Repostero", "Servicios de Limpieza", "Cuidado de Personas (Niñera/Cuidador)", "Jardinero y Paisajista"]
    static let organizaciones = ["Policía", "Bomberos", "Hospital / Sala de Emergencias", "Escuela Primaria / Secundaria", "Municipalidad / Ayuntamiento", "Defensa Civil", "Centro Comunitario"]

    static let tipos = ["Comercio", "Servicio", "Organización Pública"]

    static func subRubros(tipo: String, rubro: String) -> [String] {
        switch tipo {
        case "Servicio": return servicios
        case "Organización Pública": return organizaciones
        default:
            return comercios.first { $0.categoria == rubro }?.subRubros ?? []
        }
    }

    static func categorias(tipo: String) -> [String] {
        tipo == "Comercio" ? comercios.map(\.categoria) : [""]
    }
}
