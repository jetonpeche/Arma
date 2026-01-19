export type Specialite =
{
    id: number,
    nom: string,
    description: string
}

export type SpecialiteLeger = Omit<Specialite, "description">;

export type SpecialiteRequete = Omit<Specialite, "id">;