export type Preset = 
{
    serveurTS: string;
    mdpTS: string;
    mdpArma: string;
    codeAmiSteam: string;
    aliasNomFichier: string | null;
}

export type PresetRequete = Omit<Preset, "aliasNomFichier">;