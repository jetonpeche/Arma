export type Logistique =
{
    kind: "Logistique",
    id: number,
    nom: string,
    description: string,
    prix: number,
    nbDetruit: number,
    listeStockageVaisseau: LogistiqueStockageVaisseau[],
    tailleUnitaireInventaire: number,
    estKit: boolean,
    ignoreTypeStockage: boolean,
    type: TypeLogistique,
    typeStockage: TypeStockageLogistique
}

export type LogistiqueRequete = Omit<Logistique, "id" | "listeStockageVaisseau">;

export type LogistiqueStockageVaisseau =
{
    nomVaisseau: string,
    nomStockage: string,
    quantite: number
}

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