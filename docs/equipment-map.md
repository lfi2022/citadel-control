# Cartographie CITADEL CONTROL

Sélection établie à partir de `CITADEL_CONTROL_Entites_Home_Assistant.xlsx` (instantané du 18 octobre 2026). Les états rendus par l’interface proviennent exclusivement de Home Assistant en direct.

| Écran | Sélection fixe |
|---|---|
| Accueil | Météo, Alarmo, synthèse des lumières, batterie tablette Huawei, puissance UPS |
| Éclairage | Salon, cuisine, bureau et couloir ; uniquement des `light.*` actives dans l’inventaire |
| Climat | Température/humidité Air Léo, bureau, cuisine, salle de bain ; météo extérieure GW2000A |
| Sécurité | Alarmo, contacts portes/fenêtres/Velux et trois caméras pertinentes |
| Énergie | Machine à laver, séchoir et alimentation UPS (puissance, énergie, batterie) |
| Réseau | Sondes de connectivité, Zigbee2MQTT, nœud Proxmox et VM OPNsense 1700 |
| Multimédia | TV, lecteurs audio déclarés et aspirateurs Coco/Dada |
| Système | Tablette Huawei, état CITADEL, santé Proxmox et Home Assistant |

Les entités désactivées sont exclues. Une entité configurée mais devenue `unavailable` reste identifiable par cet état en direct ; elle n’est jamais présentée comme fonctionnelle.
