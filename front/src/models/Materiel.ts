export type Materiel = 
{
    kind: "Materiel",
    id: number,
    type: TypeMateriel,
    nom: string,
    description: string | null,
    prix: number,
    stock: number,
    nbPlacer: number,
    nbDetruit: number
}

export type MaterielRequete = 
{
    idTypeMateriel: number,
    nom: string,
    description: string | null,
    prix: number,
    stock: number,
    nbPlacer: number,
    nbDetruit: number
}

export type TypeMateriel = 
{
    id: number,
    nom: string
}
