import { inject } from "@angular/core";
import { Panier } from "@models/Panier";
import { SnackBarService } from "./SnackBarService";
import { ETypeObjetProposer } from "@enums/ETypeObjetProposer";

export class PanierService
{
    private readonly CLE_LOCAL_STORAGE = "panier";

    private snackBarServ = inject(SnackBarService);

    Lister(): Panier[]
    {
        if(localStorage.getItem(this.CLE_LOCAL_STORAGE))
            return JSON.parse(localStorage.getItem(this.CLE_LOCAL_STORAGE)) as Panier[];

        return [];
    }

    Ajouter(_liste: Panier[]): void
    {
        let liste: Panier[] = [];
        const NOM = _liste[0].nom;
        
        if(localStorage.getItem(this.CLE_LOCAL_STORAGE))
        {
            liste = JSON.parse(localStorage.getItem(this.CLE_LOCAL_STORAGE)) as Panier[];

            for (const element of _liste) 
            {
                const INDEX = liste.findIndex(x => 
                    x.idType == element.idType && 
                    x.type == element.type &&
                    x.vaisseau?.id == element.vaisseau?.id &&
                    x.idStockage == element.idStockage
                );

                if(INDEX != -1)
                {
                    liste[INDEX].quantite = element.quantite;
                    
                    if(element.type == ETypeObjetProposer.Logistique)
                    {
                        liste[INDEX].idStockage = element.idStockage;
                        liste[INDEX].vaisseau.id = element.vaisseau.id;
                        liste[INDEX].vaisseau.nom = element.vaisseau.nom;
                    }

                    this.snackBarServ.Ok(`${NOM} a été modifiée`);
                }
                else
                {
                    liste.push(element);
                    this.snackBarServ.Ok(`${NOM} à été ajouté au panier`);
                }
            }
        }
        else
        {
            liste = [..._liste];
            this.snackBarServ.Ok(`${NOM} à été ajouté au panier`);
        }

        localStorage.setItem(this.CLE_LOCAL_STORAGE, JSON.stringify(liste));
    }

    Modifier(_objet: Panier): void
    {
        if(!localStorage.getItem(this.CLE_LOCAL_STORAGE))
            return;

        let liste = JSON.parse(localStorage.getItem(this.CLE_LOCAL_STORAGE)) as Panier[];

        let element = liste.find(x => x.id == _objet.id);
        
        if(!element)
            return;

        element.quantite = _objet.quantite;
        element.idStockage = _objet.idStockage,
        element.vaisseau = _objet.vaisseau != null ? {
            id: _objet.vaisseau.id,
            nom: _objet.vaisseau.nom
        } : null
        
        localStorage.setItem(this.CLE_LOCAL_STORAGE, JSON.stringify(liste));

        this.snackBarServ.Ok(`${element.nom} a été modifié`);
    }

    Supprimer(_objet: Panier): boolean
    {
        if(!localStorage.getItem(this.CLE_LOCAL_STORAGE))
            return false;

        let liste = JSON.parse(localStorage.getItem(this.CLE_LOCAL_STORAGE)) as Panier[];

        liste = liste.filter(x => !(x.idType == _objet.idType && x.type == _objet.type && x.vaisseau?.id == _objet.vaisseau?.id && x.idStockage == _objet.idStockage));

        if(liste.length == 0)
            localStorage.removeItem(this.CLE_LOCAL_STORAGE);

        else
            localStorage.setItem(this.CLE_LOCAL_STORAGE, JSON.stringify(liste));

        this.snackBarServ.Ok(`${_objet.nom} a été supprimé du panier`);

        return true;
    }

    Vider(): void
    {
        localStorage.removeItem(this.CLE_LOCAL_STORAGE);
    }
}