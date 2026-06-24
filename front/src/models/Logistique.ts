export type Logistique =
{
    kind: "Logistique",
    id: number,
    nom: string,
    prix: number,
    nbDetruit: number,
    stock: number,
    tailleUnitaireInventaire: number,
    estKit: boolean,
    ignoreTypeStockage: boolean,
    type: TypeLogistique,
    typeStockage: TypeStockageLogistique
}

export type LogistiqueRequete = Omit<Logistique, "id">;

export type TypeLogistique = 
{
    id: number,
    nom: string
}

export type TypeStockageLogistique = 
{
    id: number,
    nom: string
}