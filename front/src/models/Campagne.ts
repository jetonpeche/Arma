export type Campagne =
{
    id: number,
    nom: string,
    resumer: string | null,
    intervalDate: string | null
}

export type CampagneRequete = Omit<Campagne, "id">