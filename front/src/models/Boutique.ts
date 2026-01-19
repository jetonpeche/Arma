export type Boutique = 
{
    id: number,
    idPrix: number,
    nom: string,
    prix: number,
    description: string | null,
    urlImageObjet: string,
    estPosseder: boolean
}

export type BoutiqueAdmin = 
{
    id: number,
    titre: string,
    description: string | null,
    urlImageObjet: string,
    listePrix: [{
        id: number,
        nom :string,
        ordre: number,
        prix: number
    }]
}

export type BoutiqueRequete =
{
    nom: string,
    prix: number,
    description: string | null
}

export type BoutiquePersonnageAcheterRequete =
{
    idBoutique: number,
    idBoutiquePrix: number
}
