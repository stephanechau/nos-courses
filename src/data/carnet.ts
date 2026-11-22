// Carnet de recettes intégré : plats courants et leurs ingrédients (pour 4 personnes).
// Une ligne par plat : Nom | emoji | autres noms (séparés par des virgules) | ingrédient:quantité ; ingrédient:quantité …
// Le sel, le poivre et l'huile ne sont pas listés : on en a toujours.

const TEXTE = `
Lasagnes|🍝|lasagne,lasagnes bolognaise|Pâtes à lasagnes:250 g;Bœuf haché:500 g;Coulis de tomate:500 g;Oignon:1;Carotte:1;Lait:50 cl;Beurre:50 g;Farine:50 g;Gruyère râpé:100 g
Spaghetti bolognaise|🍝|bolognaise,spaghettis bolognaise,pates bolognaise|Spaghetti:500 g;Bœuf haché:400 g;Coulis de tomate:500 g;Oignon:1;Carotte:1;Ail:2 gousses;Parmesan:50 g
Spaghetti carbonara|🍝|carbonara,pates carbonara|Spaghetti:500 g;Lardons:200 g;Œufs:4;Parmesan:80 g;Crème fraîche:20 cl
Pâtes au pesto|🍝|pesto|Pâtes:500 g;Pesto:1 pot;Parmesan:50 g;Pignons de pin:30 g
Pâtes au saumon|🍝|pates saumon|Pâtes:500 g;Saumon fumé:200 g;Crème fraîche:20 cl;Citron:1;Aneth:1 botte
Gratin de pâtes|🧀|gratin de macaronis|Macaronis:400 g;Jambon:4 tranches;Crème fraîche:20 cl;Gruyère râpé:150 g;Lait:20 cl
Macaronis au fromage|🧀|mac and cheese,mac & cheese|Macaronis:400 g;Cheddar:200 g;Lait:50 cl;Beurre:40 g;Farine:40 g
One pot pasta|🍝|one pot|Pâtes:400 g;Tomates cerises:250 g;Oignon:1;Ail:2 gousses;Basilic:1 botte;Parmesan:50 g;Bouillon de légumes:1 cube
Risotto aux champignons|🍚|risotto|Riz arborio:300 g;Champignons de Paris:400 g;Oignon:1;Vin blanc:10 cl;Bouillon de volaille:1 cube;Parmesan:80 g;Beurre:30 g
Gnocchis à la sauce tomate|🥔|gnocchis|Gnocchis:800 g;Coulis de tomate:500 g;Mozzarella:1;Basilic:1 botte
Raviolis|🥟|ravioli|Raviolis frais:600 g;Crème fraîche:20 cl;Parmesan:50 g
Pizza maison|🍕|pizza|Pâte à pizza:1;Coulis de tomate:200 g;Mozzarella:2;Jambon:4 tranches;Champignons de Paris:200 g;Olives noires:50 g
Quiche lorraine|🥧|quiche|Pâte brisée:1;Lardons:200 g;Œufs:3;Crème fraîche:20 cl;Lait:20 cl;Gruyère râpé:100 g
Quiche aux poireaux|🥧|tarte aux poireaux,flamiche|Pâte brisée:1;Poireaux:3;Œufs:3;Crème fraîche:20 cl;Gruyère râpé:80 g
Tarte à la tomate|🍅|tarte tomate moutarde|Pâte brisée:1;Tomates:5;Moutarde:2 c. à soupe;Gruyère râpé:80 g;Herbes de Provence:1 pot
Tarte au thon|🥧|tarte thon|Pâte brisée:1;Thon en boîte:2 boîtes;Tomates:3;Œufs:3;Crème fraîche:20 cl;Moutarde:1 pot
Croque-monsieur|🥪|croque monsieur,croques|Pain de mie:8 tranches;Jambon:4 tranches;Emmental:8 tranches;Beurre:40 g;Béchamel:1 brique
Croque-madame|🍳|croque madame|Pain de mie:8 tranches;Jambon:4 tranches;Emmental:8 tranches;Œufs:4;Beurre:40 g
Hachis parmentier|🥔|parmentier|Pommes de terre:1 kg;Bœuf haché:500 g;Oignon:2;Lait:20 cl;Beurre:50 g;Gruyère râpé:100 g
Gratin dauphinois|🥔|dauphinois,gratin de pommes de terre|Pommes de terre:1,2 kg;Crème fraîche:40 cl;Lait:50 cl;Ail:2 gousses;Muscade:1 pot
Tartiflette|🧀|tartiflette savoyarde|Pommes de terre:1 kg;Reblochon:1;Lardons:200 g;Oignon:2;Crème fraîche:20 cl;Vin blanc:10 cl
Raclette|🧀|raclette party|Fromage à raclette:800 g;Pommes de terre:1,2 kg;Jambon cru:200 g;Rosette:150 g;Jambon blanc:4 tranches;Cornichons:1 bocal
Fondue savoyarde|🫕|fondue|Comté:400 g;Beaufort:400 g;Emmental:400 g;Vin blanc:1 bouteille;Pain:2 baguettes;Ail:1 gousse;Kirsch:1 petite bouteille
Purée maison|🥔|puree|Pommes de terre:1 kg;Lait:30 cl;Beurre:60 g;Muscade:1 pot
Frites maison|🍟|frites|Pommes de terre:1,5 kg;Huile de friture:1 bouteille
Pommes de terre sautées|🥔|patates sautees|Pommes de terre:1 kg;Ail:2 gousses;Persil:1 botte
Potatoes|🥔|potatoes maison|Pommes de terre:1 kg;Paprika:1 pot;Herbes de Provence:1 pot
Steak frites|🥩|steak|Steaks:4;Pommes de terre:1,5 kg;Salade verte:1
Bœuf bourguignon|🍲|bourguignon|Bœuf à braiser:1,2 kg;Vin rouge:1 bouteille;Lardons:200 g;Carottes:4;Oignons:2;Champignons de Paris:250 g;Bouquet garni:1;Farine:2 c. à soupe
Pot-au-feu|🍲|pot au feu|Bœuf (paleron, gîte):1,5 kg;Os à moelle:4;Carottes:6;Poireaux:3;Navets:4;Pommes de terre:8;Oignon:1;Bouquet garni:1
Blanquette de veau|🍲|blanquette|Veau (épaule):1,2 kg;Carottes:3;Champignons de Paris:250 g;Oignon:1;Crème fraîche:20 cl;Jaune d'œuf:1;Citron:1;Riz:300 g
Daube provençale|🍲|daube|Bœuf à braiser:1,2 kg;Vin rouge:1 bouteille;Carottes:3;Oignons:2;Lardons:150 g;Orange:1;Bouquet garni:1
Carbonade flamande|🍺|carbonade|Bœuf à braiser:1,2 kg;Bière brune:75 cl;Oignons:4;Pain d'épices:4 tranches;Moutarde:1 pot;Cassonade:1 paquet
Chili con carne|🌶️|chili|Bœuf haché:500 g;Haricots rouges:2 boîtes;Tomates concassées:1 boîte;Oignon:2;Poivron:1;Épices chili:1 pot;Riz:300 g
Hamburgers maison|🍔|burger,burgers,hamburger|Pains à burger:4;Steaks hachés:4;Cheddar:4 tranches;Tomates:2;Salade verte:1;Oignon rouge:1;Ketchup:1
Boulettes à la sauce tomate|🍝|boulettes,boulettes de viande|Bœuf haché:500 g;Œuf:1;Chapelure:50 g;Coulis de tomate:500 g;Oignon:1;Pâtes:400 g
Rôti de bœuf|🥩|roti de boeuf|Rôti de bœuf:1 kg;Pommes de terre:1 kg;Haricots verts:500 g
Rôti de porc|🐖|roti de porc|Rôti de porc:1 kg;Pommes de terre:1 kg;Oignons:2;Moutarde:1 pot
Sauté de porc au caramel|🐖|porc au caramel|Échine de porc:800 g;Sucre:100 g;Sauce soja:1 bouteille;Oignons:2;Riz:300 g
Côtes de porc|🐖|cotelettes de porc|Côtes de porc:4;Pommes de terre:1 kg;Moutarde:1 pot
Saucisses lentilles|🌭|petit sale aux lentilles,lentilles saucisses|Saucisses de Morteau:2;Lentilles vertes:400 g;Carottes:3;Oignon:1;Lardons:150 g;Bouquet garni:1
Choucroute|🌭|choucroute garnie|Choucroute cuite:1,5 kg;Saucisses de Strasbourg:8;Saucisses de Morteau:1;Lard fumé:400 g;Pommes de terre:8;Vin blanc:1 bouteille
Cassoulet|🍲|cassoulet maison|Cassoulet en boîte:1 boîte;Saucisses de Toulouse:4;Confit de canard:4 cuisses;Chapelure:1 paquet
Saucisses purée|🌭|saucisse puree|Saucisses de Toulouse:8;Pommes de terre:1 kg;Lait:30 cl;Beurre:60 g
Jambon purée|🥔|jambon puree|Jambon:4 tranches;Pommes de terre:1 kg;Lait:30 cl;Beurre:60 g
Endives au jambon|🥬|endives jambon|Endives:8;Jambon:8 tranches;Lait:50 cl;Beurre:50 g;Farine:50 g;Gruyère râpé:100 g
Poulet rôti|🍗|poulet roti|Poulet entier:1;Pommes de terre:1 kg;Ail:4 gousses;Thym:1 botte
Poulet basquaise|🍗|basquaise|Cuisses de poulet:4;Poivrons:3;Tomates:4;Oignons:2;Ail:2 gousses;Piment d'Espelette:1 pot;Riz:300 g
Poulet au curry|🍛|curry de poulet,poulet curry,curry|Blancs de poulet:600 g;Lait de coco:40 cl;Pâte de curry:1 pot;Oignon:1;Ail:2 gousses;Gingembre:1 morceau;Riz basmati:300 g;Coriandre:1 botte
Poulet à la crème|🍗|poulet creme champignons|Blancs de poulet:600 g;Crème fraîche:20 cl;Champignons de Paris:250 g;Oignon:1;Riz:300 g
Poulet tikka masala|🍛|tikka masala|Blancs de poulet:600 g;Yaourt nature:2;Coulis de tomate:400 g;Crème fraîche:20 cl;Épices tikka masala:1 pot;Oignon:1;Riz basmati:300 g;Naans:4
Poulet tandoori|🍗|tandoori|Cuisses de poulet:4;Yaourt nature:2;Épices tandoori:1 pot;Citron:1;Riz basmati:300 g
Poulet au citron|🍋|poulet citron|Cuisses de poulet:4;Citrons:2;Ail:3 gousses;Thym:1 botte;Pommes de terre:800 g
Poulet aux olives|🫒|poulet olives|Cuisses de poulet:4;Olives vertes:150 g;Tomates concassées:1 boîte;Oignons:2;Ail:2 gousses
Cordons bleus|🍗|cordon bleu|Cordons bleus:4;Haricots verts:500 g
Escalopes milanaises|🍗|escalope panee,escalopes panees|Escalopes de poulet:4;Chapelure:100 g;Œufs:2;Farine:50 g;Citron:1;Spaghetti:400 g
Nuggets maison|🍗|nuggets|Blancs de poulet:600 g;Corn flakes:100 g;Œufs:2;Farine:50 g
Fajitas au poulet|🌯|fajitas|Tortillas:8;Blancs de poulet:600 g;Poivrons:2;Oignon:1;Épices fajitas:1 sachet;Crème fraîche:20 cl;Cheddar râpé:100 g
Tacos|🌮|tacos mexicains|Tortillas:8;Bœuf haché:500 g;Épices tacos:1 sachet;Tomates:2;Salade verte:1;Cheddar râpé:100 g;Crème fraîche:20 cl
Wraps|🌯|wrap|Tortillas:8;Blancs de poulet:400 g;Salade verte:1;Tomates:2;Fromage frais:1
Burritos|🌯|burrito|Tortillas:8;Bœuf haché:400 g;Haricots rouges:1 boîte;Riz:200 g;Maïs:1 boîte;Cheddar râpé:100 g
Couscous|🍲|couscous royal|Semoule:500 g;Merguez:8;Cuisses de poulet:4;Carottes:4;Courgettes:3;Navets:3;Pois chiches:1 boîte;Épices à couscous:1 pot;Concentré de tomate:1 tube
Tajine de poulet|🍲|tajine|Cuisses de poulet:4;Citrons confits:2;Olives vertes:150 g;Oignons:2;Épices à tajine:1 pot;Coriandre:1 botte;Semoule:300 g
Tajine d'agneau|🍲|tajine agneau|Épaule d'agneau:1 kg;Pruneaux:200 g;Amandes:50 g;Oignons:2;Miel:1 pot;Épices à tajine:1 pot;Semoule:300 g
Gigot d'agneau|🍖|gigot|Gigot d'agneau:1,8 kg;Ail:6 gousses;Flageolets:2 boîtes;Romarin:1 botte
Navarin d'agneau|🍲|navarin|Épaule d'agneau:1 kg;Carottes:4;Navets:4;Petits pois:300 g;Pommes de terre:600 g;Oignons:2
Moussaka|🍆|moussaka grecque|Aubergines:3;Agneau haché:500 g;Tomates concassées:1 boîte;Oignon:1;Lait:50 cl;Beurre:50 g;Farine:50 g;Parmesan:50 g
Ratatouille|🍆|ratatouille nicoise|Aubergines:2;Courgettes:3;Poivrons:2;Tomates:4;Oignons:2;Ail:3 gousses;Herbes de Provence:1 pot
Tian de légumes|🍅|tian|Courgettes:2;Aubergine:1;Tomates:4;Oignon:1;Herbes de Provence:1 pot
Gratin de courgettes|🥒|gratin courgettes|Courgettes:5;Œufs:3;Crème fraîche:20 cl;Gruyère râpé:100 g
Courgettes farcies|🥒|legumes farcis|Courgettes rondes:4;Chair à saucisse:400 g;Oignon:1;Chapelure:30 g;Riz:200 g
Tomates farcies|🍅|tomates farcies|Tomates:8;Chair à saucisse:500 g;Oignon:1;Persil:1 botte;Riz:250 g
Poivrons farcis|🫑|poivrons farcis|Poivrons:4;Bœuf haché:400 g;Riz:200 g;Coulis de tomate:300 g;Oignon:1
Gratin de chou-fleur|🥦|gratin chou fleur|Chou-fleur:1;Lait:50 cl;Beurre:50 g;Farine:50 g;Gruyère râpé:100 g
Gratin de brocolis|🥦|gratin brocoli|Brocolis:800 g;Crème fraîche:20 cl;Œufs:2;Gruyère râpé:100 g
Soupe de légumes|🥣|soupe,potage|Poireaux:2;Carottes:4;Pommes de terre:3;Navet:1;Oignon:1;Bouillon de légumes:1 cube
Velouté de potiron|🎃|soupe de potiron,veloute potiron,soupe de courge|Potiron:1 kg;Pommes de terre:2;Oignon:1;Crème fraîche:20 cl;Bouillon de légumes:1 cube
Velouté de butternut|🎃|soupe butternut|Courge butternut:1;Oignon:1;Lait de coco:20 cl;Bouillon de légumes:1 cube
Soupe à l'oignon|🧅|soupe oignon|Oignons:1 kg;Beurre:50 g;Farine:1 c. à soupe;Bouillon de bœuf:1 cube;Pain:1 baguette;Gruyère râpé:150 g
Gaspacho|🍅|gazpacho|Tomates:1 kg;Concombre:1;Poivron rouge:1;Oignon:1;Ail:1 gousse;Vinaigre de xérès:1 bouteille
Velouté de champignons|🍄|soupe champignons|Champignons de Paris:500 g;Oignon:1;Crème fraîche:20 cl;Bouillon de volaille:1 cube
Minestrone|🥣|minestrone|Courgette:1;Carottes:2;Céleri:2 branches;Haricots blancs:1 boîte;Tomates concassées:1 boîte;Petites pâtes:100 g;Parmesan:50 g
Soupe miso|🍜|miso|Pâte miso:1 pot;Tofu:200 g;Algues wakamé:1 sachet;Oignons nouveaux:1 botte
Ramen|🍜|ramens|Nouilles ramen:4 portions;Bouillon de volaille:1 cube;Œufs:4;Porc (poitrine):400 g;Sauce soja:1 bouteille;Oignons nouveaux:1 botte;Champignons shiitake:100 g
Pad thaï|🍜|pad thai|Nouilles de riz:300 g;Crevettes:300 g;Œufs:2;Pousses de soja:200 g;Cacahuètes:50 g;Citron vert:2;Sauce nuoc-mâm:1 bouteille;Sucre de palme:1 paquet
Nouilles sautées|🍜|nouilles sautees,wok de nouilles|Nouilles chinoises:400 g;Poulet:400 g;Poivron:1;Carottes:2;Oignon:1;Sauce soja:1 bouteille;Sauce huître:1 bouteille
Riz cantonais|🍚|riz cantonnais|Riz:300 g;Œufs:3;Jambon:3 tranches;Petits pois:150 g;Oignons nouveaux:1 botte;Sauce soja:1 bouteille
Bœuf aux oignons|🥩|boeuf oignons wok|Bœuf (rumsteck):600 g;Oignons:3;Sauce soja:1 bouteille;Sauce huître:1 bouteille;Gingembre:1 morceau;Riz:300 g
Porc aigre-doux|🍍|porc aigre doux|Échine de porc:600 g;Ananas:1 boîte;Poivron:2;Oignon:1;Ketchup:1;Vinaigre de riz:1 bouteille;Riz:300 g
Poulet aux noix de cajou|🥜|poulet cajou|Blancs de poulet:600 g;Noix de cajou:100 g;Poivron:1;Oignon:1;Sauce soja:1 bouteille;Riz:300 g
Bo bun|🥗|bobun,bo bun boeuf|Vermicelles de riz:300 g;Bœuf (rumsteck):500 g;Nems:8;Salade verte:1;Carottes:2;Concombre:1;Menthe:1 botte;Cacahuètes:50 g;Sauce nuoc-mâm:1 bouteille
Nems|🥢|nems maison|Galettes de riz:20;Porc haché:400 g;Vermicelles de riz:100 g;Champignons noirs:30 g;Carotte:1;Salade verte:1;Menthe:1 botte
Rouleaux de printemps|🥢|rouleaux printemps|Galettes de riz:12;Crevettes:300 g;Vermicelles de riz:100 g;Salade verte:1;Menthe:1 botte;Carotte:1
Sushis maison|🍣|sushi,makis,makis maison|Riz à sushi:500 g;Vinaigre de riz:1 bouteille;Feuilles de nori:1 paquet;Saumon frais:300 g;Avocat:2;Concombre:1;Sauce soja:1 bouteille;Wasabi:1 tube
Poke bowl|🥗|poke|Riz à sushi:300 g;Saumon frais:400 g;Avocat:2;Edamame:200 g;Concombre:1;Mangue:1;Graines de sésame:1 sachet;Sauce soja:1 bouteille
Dal de lentilles|🍛|dahl,dal|Lentilles corail:300 g;Lait de coco:40 cl;Tomates concassées:1 boîte;Oignon:1;Ail:2 gousses;Gingembre:1 morceau;Curry:1 pot;Riz basmati:300 g
Curry de légumes|🍛|curry legumes|Pois chiches:1 boîte;Patate douce:2;Épinards:200 g;Lait de coco:40 cl;Pâte de curry:1 pot;Oignon:1;Riz basmati:300 g
Paella|🥘|paella|Riz rond:400 g;Cuisses de poulet:4;Moules:1 kg;Crevettes:400 g;Chorizo:150 g;Petits pois:200 g;Poivron rouge:1;Safran:1 dose;Oignon:1
Saumon au four|🐟|pave de saumon,saumon|Pavés de saumon:4;Citron:1;Aneth:1 botte;Riz:300 g;Haricots verts:500 g
Papillotes de poisson|🐟|papillote,papillotes|Filets de cabillaud:4;Courgettes:2;Tomates cerises:250 g;Citron:1;Herbes de Provence:1 pot
Poisson pané|🐟|poisson pane|Poisson pané:8;Pommes de terre:1 kg;Citron:1
Fish and chips|🐟|fish & chips|Filets de cabillaud:4;Farine:200 g;Bière blonde:25 cl;Pommes de terre:1,5 kg;Citron:1
Brandade de morue|🐟|brandade|Morue dessalée:600 g;Pommes de terre:800 g;Lait:30 cl;Ail:3 gousses;Persil:1 botte
Moules frites|🦪|moules marinieres,moules|Moules:3 kg;Échalotes:3;Vin blanc:25 cl;Persil:1 botte;Beurre:50 g;Pommes de terre:1,5 kg
Crevettes à l'ail|🦐|crevettes|Crevettes:600 g;Ail:4 gousses;Persil:1 botte;Riz:300 g;Citron:1
Bouillabaisse|🐟|soupe de poisson|Poissons à soupe:1,5 kg;Tomates:4;Fenouil:1;Oignons:2;Safran:1 dose;Pain:1 baguette;Rouille:1 pot
Thon à la tomate|🐟|thon tomate|Thon frais:600 g;Tomates concassées:1 boîte;Oignons:2;Poivron:1;Riz:300 g
Hachis de poisson|🐟|parmentier de poisson|Filets de cabillaud:600 g;Pommes de terre:1 kg;Lait:30 cl;Beurre:50 g;Gruyère râpé:80 g
Salade niçoise|🥗|nicoise|Salade verte:1;Tomates:4;Thon en boîte:2 boîtes;Œufs:4;Olives noires:80 g;Anchois:1 boîte;Haricots verts:300 g;Poivron:1
Salade César|🥗|cesar,salade caesar|Salade romaine:2;Blancs de poulet:400 g;Parmesan:60 g;Croûtons:1 sachet;Sauce César:1 bouteille
Salade de pâtes|🥗|salade pates|Pâtes:400 g;Tomates cerises:250 g;Mozzarella:1;Jambon:4 tranches;Maïs:1 boîte;Olives:80 g
Salade de riz|🥗|salade riz|Riz:300 g;Thon en boîte:2 boîtes;Tomates:3;Maïs:1 boîte;Œufs:3;Cornichons:1 bocal
Taboulé|🥗|taboule|Semoule:300 g;Tomates:4;Concombre:1;Menthe:1 botte;Persil:1 botte;Citrons:2;Oignon rouge:1
Salade de lentilles|🥗|lentilles salade|Lentilles vertes:300 g;Échalote:1;Lardons:150 g;Œufs:4;Moutarde:1 pot
Salade grecque|🥗|grecque|Tomates:4;Concombre:1;Feta:200 g;Olives noires:100 g;Oignon rouge:1;Poivron vert:1
Salade de chèvre chaud|🧀|chevre chaud|Salade verte:1;Bûche de chèvre:1;Pain:1 baguette;Miel:1 pot;Noix:50 g
Salade piémontaise|🥗|piemontaise|Pommes de terre:800 g;Tomates:3;Œufs:4;Jambon:4 tranches;Cornichons:1 bocal;Mayonnaise:1 pot
Tomates mozzarella|🍅|caprese,tomate mozza|Tomates:6;Mozzarella:2;Basilic:1 botte;Vinaigre balsamique:1 bouteille
Carottes râpées|🥕|carottes rapees|Carottes:1 kg;Citron:1;Persil:1 botte
Taboulé de chou-fleur|🥦|taboule chou fleur|Chou-fleur:1;Tomates:3;Concombre:1;Menthe:1 botte;Citron:2
Omelette|🍳|omelette aux champignons|Œufs:8;Champignons de Paris:250 g;Gruyère râpé:80 g;Ciboulette:1 botte
Œufs cocotte|🥚|oeufs cocotte|Œufs:8;Crème fraîche:20 cl;Jambon:2 tranches;Pain:1 baguette
Œufs mimosa|🥚|oeufs mimosa|Œufs:12;Mayonnaise:1 pot;Salade verte:1
Shakshuka|🍳|chakchouka|Œufs:8;Tomates concassées:2 boîtes;Poivrons:2;Oignon:1;Ail:2 gousses;Cumin:1 pot;Pain:1 baguette
Tortilla espagnole|🥔|tortilla,omelette espagnole|Pommes de terre:800 g;Œufs:8;Oignons:2
Galettes de sarrasin|🥞|galettes,galettes bretonnes,crepes salees|Farine de sarrasin:500 g;Œufs:5;Jambon:6 tranches;Emmental râpé:200 g;Beurre demi-sel:100 g
Crêpes|🥞|crepes sucrees|Farine:250 g;Œufs:4;Lait:50 cl;Beurre:50 g;Sucre:2 c. à soupe;Pâte à tartiner:1 pot
Gaufres|🧇|gaufre|Farine:250 g;Œufs:3;Lait:50 cl;Beurre:100 g;Sucre:50 g;Levure chimique:1 sachet
Pancakes|🥞|pancake|Farine:250 g;Œufs:2;Lait:30 cl;Sucre:30 g;Levure chimique:1 sachet;Sirop d'érable:1 bouteille
Pain perdu|🍞|pain perdu|Pain rassis:8 tranches;Œufs:3;Lait:25 cl;Sucre:50 g;Beurre:30 g
Croque au four|🥪|croques au four|Pain de mie:8 tranches;Jambon:4 tranches;Béchamel:1 brique;Gruyère râpé:150 g
Hot-dogs|🌭|hot dog|Pains à hot-dog:6;Saucisses de Strasbourg:6;Moutarde:1 pot;Ketchup:1;Oignons frits:1 boîte
Kebab maison|🥙|kebab,doner|Pains pita:4;Blancs de poulet:600 g;Yaourt nature:2;Salade verte:1;Tomates:2;Oignon rouge:1;Épices kebab:1 sachet
Falafels|🧆|falafel|Pois chiches:2 boîtes;Oignon:1;Persil:1 botte;Coriandre:1 botte;Cumin:1 pot;Pains pita:4;Yaourt nature:1
Houmous|🧆|hummus|Pois chiches:1 boîte;Tahin:1 pot;Citron:1;Ail:1 gousse
Chou farci|🥬|chou farci|Chou vert:1;Chair à saucisse:600 g;Oignon:1;Carottes:2;Bouillon de bœuf:1 cube
Lapin à la moutarde|🐇|lapin moutarde|Lapin en morceaux:1,2 kg;Moutarde:1 pot;Crème fraîche:20 cl;Échalotes:3;Vin blanc:20 cl;Tagliatelles:400 g
Coq au vin|🐓|coq au vin|Coq en morceaux:1,8 kg;Vin rouge:1 bouteille;Lardons:200 g;Champignons de Paris:250 g;Oignons grelots:200 g;Carottes:2
Magret de canard|🦆|magret|Magrets de canard:2;Pommes de terre:1 kg;Miel:1 pot
Confit de canard|🦆|confit|Confit de canard:4 cuisses;Pommes de terre:1 kg;Ail:3 gousses;Persil:1 botte
Osso buco|🍲|ossobuco|Jarret de veau:4 tranches;Tomates concassées:1 boîte;Carottes:2;Oignon:1;Céleri:1 branche;Vin blanc:20 cl;Orange:1
Escalopes de veau à la crème|🥩|escalope de veau|Escalopes de veau:4;Champignons de Paris:250 g;Crème fraîche:20 cl;Tagliatelles:400 g
Foie de veau|🥩|foie|Foie de veau:4 tranches;Oignons:2;Vinaigre de framboise:1 bouteille;Purée:1
Andouillette|🌭|andouillettes|Andouillettes:4;Moutarde:1 pot;Pommes de terre:1 kg
Barbecue|🔥|grillades,bbq|Merguez:8;Chipolatas:8;Brochettes:4;Pain:2 baguettes;Charbon de bois:1 sac;Salade verte:1;Ketchup:1
Brochettes de poulet|🍢|brochettes|Blancs de poulet:600 g;Poivrons:2;Oignon rouge:1;Courgette:1;Citron:1
Plancha|🔥|plancha|Crevettes:400 g;Calamars:400 g;Magret de canard:1;Courgettes:2;Poivrons:2;Ail:3 gousses
Croziflette|🧀|crozets|Crozets:400 g;Reblochon:1;Lardons:200 g;Oignon:1;Crème fraîche:20 cl
Aligot saucisses|🧀|aligot|Pommes de terre:1 kg;Tomme fraîche:400 g;Crème fraîche:20 cl;Beurre:50 g;Ail:1 gousse;Saucisses de Toulouse:8
Welsh|🧀|welsh rarebit|Cheddar:500 g;Bière blonde:25 cl;Pain de campagne:4 tranches;Jambon:4 tranches;Œufs:4;Moutarde:1 pot
Ficelle picarde|🥞|ficelles picardes|Crêpes:8;Jambon:8 tranches;Champignons de Paris:250 g;Crème fraîche:30 cl;Gruyère râpé:100 g
Feuilletés à la saucisse|🥐|friands|Pâte feuilletée:2;Chair à saucisse:400 g;Œuf:1
Bouchées à la reine|🥐|vol au vent,vol-au-vent|Bouchées feuilletées:4;Blancs de poulet:400 g;Champignons de Paris:250 g;Crème fraîche:20 cl;Riz:300 g
Clafoutis aux cerises|🍒|clafoutis|Cerises:500 g;Œufs:3;Farine:80 g;Sucre:100 g;Lait:30 cl
Gâteau au chocolat|🍫|fondant au chocolat,moelleux au chocolat,gateau chocolat|Chocolat noir:200 g;Beurre:150 g;Sucre:150 g;Œufs:4;Farine:60 g
Gâteau au yaourt|🍰|gateau yaourt|Yaourt nature:1;Farine:3 pots;Sucre:2 pots;Œufs:3;Huile:1/2 pot;Levure chimique:1 sachet
Tarte aux pommes|🥧|tarte pommes|Pâte brisée:1;Pommes:6;Sucre:50 g;Beurre:30 g;Compote de pommes:1 pot
Crumble aux pommes|🍏|crumble|Pommes:6;Farine:150 g;Beurre:100 g;Sucre roux:100 g;Cannelle:1 pot
Tarte au citron|🍋|tarte citron|Pâte sablée:1;Citrons:4;Œufs:4;Sucre:150 g;Beurre:100 g
Mousse au chocolat|🍫|mousse chocolat|Chocolat noir:200 g;Œufs:6;Sucre:30 g
Tiramisu|☕|tiramisu|Mascarpone:500 g;Œufs:4;Sucre:100 g;Biscuits à la cuillère:1 paquet;Café:1 paquet;Cacao en poudre:1 boîte
Riz au lait|🍚|riz au lait|Riz rond:150 g;Lait:1 l;Sucre:100 g;Vanille:1 gousse
Crème brûlée|🍮|creme brulee|Crème liquide:50 cl;Jaunes d'œufs:6;Sucre:100 g;Vanille:1 gousse;Cassonade:1 paquet
Panna cotta|🍮|pannacotta|Crème liquide:50 cl;Sucre:60 g;Gélatine:3 feuilles;Coulis de fruits rouges:1 pot
Flan pâtissier|🍮|flan|Pâte brisée:1;Lait:1 l;Œufs:4;Sucre:200 g;Maïzena:90 g;Vanille:1 gousse
Cookies|🍪|cookie|Farine:250 g;Beurre:125 g;Sucre roux:150 g;Œuf:1;Pépites de chocolat:200 g;Levure chimique:1 sachet
Brownies|🍫|brownie|Chocolat noir:200 g;Beurre:150 g;Sucre:200 g;Œufs:3;Farine:100 g;Noix de pécan:80 g
Cake aux fruits confits|🍰|cake|Farine:200 g;Beurre:150 g;Sucre:150 g;Œufs:3;Fruits confits:200 g;Levure chimique:1 sachet
Cake salé|🍞|cake jambon olives|Farine:200 g;Œufs:3;Lait:10 cl;Jambon:4 tranches;Olives vertes:100 g;Gruyère râpé:100 g;Levure chimique:1 sachet
Banana bread|🍌|banana bread|Bananes mûres:3;Farine:250 g;Beurre:100 g;Sucre roux:100 g;Œufs:2;Levure chimique:1 sachet
Galette des rois|👑|galette des rois,frangipane|Pâte feuilletée:2;Poudre d'amandes:125 g;Beurre:100 g;Sucre:100 g;Œufs:2;Fève:1
Muffins|🧁|muffin|Farine:250 g;Sucre:120 g;Œufs:2;Lait:20 cl;Beurre:80 g;Myrtilles:150 g;Levure chimique:1 sachet
Salade de fruits|🍓|salade fruits|Fraises:250 g;Kiwis:3;Bananes:2;Oranges:2;Pommes:2;Ananas:1
Fondue au chocolat|🍫|fondue chocolat|Chocolat noir:300 g;Crème liquide:20 cl;Fraises:250 g;Bananes:3;Ananas:1;Marshmallows:1 paquet
`;

export interface CarnetIngredient {
  name: string;
  qty?: string;
}

export interface CarnetRecette {
  name: string;
  emoji: string;
  aliases: string[];
  ingredients: CarnetIngredient[];
}

export const CARNET: CarnetRecette[] = TEXTE.trim()
  .split('\n')
  .map((line) => {
    const [name, emoji, aliases, ings] = line.split('|');
    return {
      name,
      emoji,
      aliases: aliases ? aliases.split(',').map((a) => a.trim()).filter(Boolean) : [],
      ingredients: ings.split(';').map((s) => {
        const [n, q] = s.split(':');
        return { name: n.trim(), qty: q?.trim() || undefined };
      })
    };
  });
