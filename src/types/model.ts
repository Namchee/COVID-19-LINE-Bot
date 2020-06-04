export interface Place {
  lat: number;
  lon: number;
}

export interface Hospital extends Place {
  nama: string;
  alamat: string;
  telepon: string | null;
}
