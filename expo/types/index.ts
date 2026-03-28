export type UserType = 'cliente' | 'comercio' | null;

export interface User {
  id: string;
  email: string;
  name: string;
  type: UserType;
  number?: string;
  fotoPerfil?: string;
}

export interface Cliente extends User {
  type: 'cliente';
  numeroCliente: string;
  fotoPerfil?: string;
}

export interface Comercio extends User {
  type: 'comercio';
  numeroComercio: string;
  nombre: string;
  telefono?: string;
  tipo?: 'Comercio' | 'Servicio' | 'Organización Pública';
  rubro?: string;
  subRubro?: string;
  fotoPerfil?: string;
  facebook?: string;
  instagram?: string;
  website?: string;
  ubicacion?: {
    latitud: number;
    longitud: number;
    calle: string;
    ciudad: string;
  };
  horarios?: DiaHorario[];
  estaDeTurno?: boolean;
  turnos?: Turno[];
}

export interface DiaHorario {
  dia: string;
  abierto: boolean;
  horarioCorrido: boolean;
  manana?: { inicio: string; fin: string };
  tarde?: { inicio: string; fin: string };
}

export interface Turno {
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

export interface Oferta {
  id: string;
  comercioId: string;
  comercioNombre: string;
  titulo: string;
  descripcion: string;
  precio: number;
  vigenciaInicio: string;
  vigenciaFin: string;
  imagenUrl?: string;
  videoUrl?: string;
}

export interface OfertaDelDia {
  id: string;
  clienteId: string;
  clienteNombre: string;
  titulo: string;
  descripcion: string;
  precio: number;
  fecha: string;
  imagenUrl?: string;
  direccion?: string;
  numeroContacto?: string;
  ubicacion?: {
    latitud: number;
    longitud: number;
    ciudad: string;
  };
}

export interface SearchResult {
  comercios: Comercio[];
  ofertas: Oferta[];
}
