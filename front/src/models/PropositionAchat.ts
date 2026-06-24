import { ETypeObjetProposer } from "@enums/ETypeObjetProposer"

export type PropositionAchat =
{
    id: number,
    auteur: string,
    liste: ObjetProposer[]
}

export type DecisionAchatRequete =
{
    idPropositionAchat: number,
    idType: number | null,
    type: ETypeObjetProposer | null,
    achatEstValider: boolean
}

export type ObjetProposerRequete =
{
    type: ETypeObjetProposer,
    idType: number,
    quantite: number
}

export type ObjetProposer =
{
    nom: string,
    prixUnitaire: number,
    quantite: number,
    type: ETypeObjetProposer,
    idType: number
}