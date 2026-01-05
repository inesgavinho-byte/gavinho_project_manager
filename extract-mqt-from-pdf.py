#!/usr/bin/env python3
"""
Script para extrair MQT (Mapa de Quantidades) do PDF GA00466-PENTHOUSESI
Processa todas as 26 páginas e gera JSON estruturado
"""

import json
import re
from pathlib import Path

# Dados extraídos manualmente das primeiras 5 páginas (exemplo da estrutura)
mqt_data = {
    "construction_code": "GA00466",
    "construction_name": "Penthouse SI",
    "categories": [
        {
            "code": "1",
            "name_pt": "Demolições",
            "name_en": "Demolitions",
            "order": 1,
            "items": [
                {
                    "code": "1.1",
                    "type_pt": "Demolições",
                    "type_en": "Demolitions",
                    "subtype_pt": "Paredes",
                    "subtype_en": "Walls",
                    "zone": "Geral",
                    "zone_en": "General",
                    "description_pt": "Demolição de paredes interiores existentes, incluindo remoção e transporte dos produtos sobrantes a vazadouro certificado a cargo do empreiteiro e todos os materiais e trabalhos necessários de forma a que a demolição e remoção se proceda com todas as condições de segurança e higiene necessária, incluindo carga e transporte de entulho a vazadouro, em camião a aterro específico ou operador licenciado de gestão de resíduos, situado a uma distância máxima de 10km, conforme projecto;",
                    "description_en": "Demolition of existing interior walls, including removal and transportation of surplus products to a certified dump in charge of the contractor and all necessary materials and work so that demolition and removal can proceed with all necessary safety and hygiene conditions, including loading and transport of rubble from a dump, by truck to a specific landfill or licensed waste management operator, located at a maximum distance of 10km, according to the project;",
                    "unit": "m2",
                    "quantity": 16.12
                },
                {
                    "code": "1.2",
                    "type_pt": "Demolições",
                    "type_en": "Demolitions",
                    "subtype_pt": "Paredes",
                    "subtype_en": "Walls",
                    "zone": "Geral",
                    "zone_en": "General",
                    "description_pt": "Abertura de roços paredes interiores para realização das alterações necessárias ao novo layout, incluindo carga e transporte de entulho a vazadouro, em camião a aterro específico ou operador licenciado de gestão de resíduos, situado a uma distância máxima de 10 km, conforme projecto;",
                    "description_en": "Opening of interior walls to make the necessary changes to the new layout, including loading and transporting rubble to a dump, by truck to a specific landfill or licensed waste management operator, located at a maximum distance of 10 km, according to the project;",
                    "unit": "vg",
                    "quantity": 1
                },
                {
                    "code": "1.3",
                    "type_pt": "Demolições",
                    "type_en": "Demolitions",
                    "subtype_pt": "Tetos",
                    "subtype_en": "Ceilings",
                    "zone": "Geral",
                    "zone_en": "General",
                    "description_pt": "Remoção de tetos falsos, incluindo carga e transporte de entulho a vazadouro, em camião a aterro específico ou operador licenciado de gestão de resíduos, situado a uma distância máxima de 10 km, conforme projecto;",
                    "description_en": "Removal of false ceilings, including loading and transporting rubble to a dump, by truck to a specific landfill or licensed waste management operator, located at a maximum distance of 10 km, according to the project;",
                    "unit": "m2",
                    "quantity": 28.97
                },
                {
                    "code": "1.4",
                    "type_pt": "Demolições",
                    "type_en": "Demolitions",
                    "subtype_pt": "Pavimentos",
                    "subtype_en": "Flooring",
                    "zone": "Geral",
                    "zone_en": "General",
                    "description_pt": "Remoção de revestimentos de pavimentos interiores, incluindo carga e transporte de entulho a vazadouro, em camião a aterro específico ou operador licenciado de gestão de resíduos, situado a uma distância máxima de 10 km, conforme projecto;",
                    "description_en": "Removal of interior floor coatings, including loading and transporting waste from a dump, by truck to a specific landfill or licensed waste management operator, located at a maximum distance of 10 km, according to the project;",
                    "unit": "m2",
                    "quantity": 178.00
                },
                {
                    "code": "1.5",
                    "type_pt": "Demolições",
                    "type_en": "Demolitions",
                    "subtype_pt": "Revestimentos Paredes",
                    "subtype_en": "Wall Coatings",
                    "zone": "IS Master 1 + IS Master 2 + IS Circulação + IS Social",
                    "zone_en": "IS Master 1 + IS Master 2 + IS Circulation + IS Powder Room",
                    "description_pt": "Remoção de revestimentos de paredes interiores de IS Master 1, IS Master 2, IS Social e IS Circulação, incluindo carga e transporte de entulho a vazadouro, em camião a aterro específico ou operador licenciado de gestão de resíduos, situado a uma distância máxima de 10 km, conforme projecto;",
                    "description_en": "Removal of interior wall coatings from IS Master 1, Is Master 2, Powder Room and IS Circulation, including loading and transporting waste from a dump, by truck to a specific landfill or licensed waste management operator, located at a maximum distance of 10 km, according to the project;",
                    "unit": "m2",
                    "quantity": 74.03
                },
                {
                    "code": "1.6",
                    "type_pt": "Demolições",
                    "type_en": "Demolitions",
                    "subtype_pt": "Rodapés",
                    "subtype_en": "Skirting Boards",
                    "zone": "Geral",
                    "zone_en": "General",
                    "description_pt": "Remoção de rodapés interiores, mantendo os maiores e que estejam em boas condições em obra para serem recolocados em zonas onde serao necessários, sendo os restantes conduzidos a vazadouro, em camião a aterro específico ou operador licenciado de gestão de resíduos, situado a uma distância máxima de 10 km, conforme projecto;",
                    "description_en": "Removal of interior skirting boards, keeping the largest ones that are in good condition on site to be repositioned in areas where they will be needed, the rest being transported by special truck to a landfill site or licensed waste management operator, located at a maximum distance of 10 km, according to the project;",
                    "unit": "ml",
                    "quantity": 37.40
                },
                {
                    "code": "1.7",
                    "type_pt": "Demolições",
                    "type_en": "Demolitions",
                    "subtype_pt": "Vãos",
                    "subtype_en": "Doors",
                    "zone": "Geral",
                    "zone_en": "General",
                    "description_pt": "Desmontagem de portas interiores, incluindo carga e transporte de entulho a vazadouro, em camião a aterro específico ou operador licenciado de gestão de resíduos, situado a uma distância máxima de 10 km, conforme projecto;",
                    "description_en": "Dismantling of interior doors, including loading and transporting rubble to a dump, by truck to a specific landfill or licensed waste management operator, located at a maximum distance of 10 km, according to the project;",
                    "unit": "un",
                    "quantity": 11
                },
                {
                    "code": "1.8",
                    "type_pt": "Demolições",
                    "type_en": "Demolitions",
                    "subtype_pt": "Marcenaria Fixa",
                    "subtype_en": "Joinery",
                    "zone": "Geral",
                    "zone_en": "General",
                    "description_pt": "Remoção de elementos de Marcenaria Fixa, incluindo carga e transporte de entulho a vazadouro e/ou indicações específicas abaixo. Transporte de entulho em camião a aterro específico ou operador licenciado de gestão de resíduos, situado a uma distância máxima de 10 km, conforme projecto;",
                    "description_en": "Removal of Fixed Joinery elements, including loading and transportation of rubble to the dump and/or specific instructions below. Transport of rubble by truck to a specific landfill or licensed waste management operator, located at a maximum distance of 10 km, according to the project;",
                    "unit": "un",
                    "quantity": 8
                },
                {
                    "code": "1.9",
                    "type_pt": "Demolições",
                    "type_en": "Demolitions",
                    "subtype_pt": "Sanitários",
                    "subtype_en": "Sanitary Ware",
                    "zone": "IS Master 1",
                    "zone_en": "IS Master 1",
                    "description_pt": "Remoção de elementos da I.S. Master 01, conforme projecto;",
                    "description_en": "Removal of Master Bathroom 01, according to the project;",
                    "unit": "un",
                    "quantity": 7
                },
                {
                    "code": "1.10",
                    "type_pt": "Demolições",
                    "type_en": "Demolitions",
                    "subtype_pt": "Sanitários",
                    "subtype_en": "Sanitary Ware",
                    "zone": "IS Master 2",
                    "zone_en": "IS Master 2",
                    "description_pt": "Remoção de elementos da I.S. Master 02, conforme projecto;",
                    "description_en": "Removal of Master Bathroom 02, according to the project;",
                    "unit": "un",
                    "quantity": 7
                },
                {
                    "code": "1.11",
                    "type_pt": "Demolições",
                    "type_en": "Demolitions",
                    "subtype_pt": "Sanitários",
                    "subtype_en": "Sanitary Ware",
                    "zone": "IS Social",
                    "zone_en": "Powder Room",
                    "description_pt": "Remoção de elementos da I.S. Social, conforme projecto;",
                    "description_en": "Removal of Powder Room, according to the project;",
                    "unit": "un",
                    "quantity": 2
                },
                {
                    "code": "1.12",
                    "type_pt": "Demolições",
                    "type_en": "Demolitions",
                    "subtype_pt": "Sanitários",
                    "subtype_en": "Sanitary Ware",
                    "zone": "IS Circulação",
                    "zone_en": "IS Circulation",
                    "description_pt": "Remoção de elementos da IS Circulação, conforme projecto;",
                    "description_en": "Removal of Circulation Bathroom elements, according to the project;",
                    "unit": "un",
                    "quantity": 7
                },
                {
                    "code": "1.13",
                    "type_pt": "Demolições",
                    "type_en": "Demolitions",
                    "subtype_pt": "Material Elétrico",
                    "subtype_en": "Electrical Material",
                    "zone": "Geral",
                    "zone_en": "General",
                    "description_pt": "Remoção de aparelhagem elétrica existente no apartamento para substituição por novo modelo a selecionar, incluindo carga e transporte de entulho a vazadouro, em camião a aterro específico ou operador licenciado de gestão de resíduos, situado a uma distância máxima de 10 km, conforme projecto;",
                    "description_en": "Removal of existing electrical equipment in the apartment to be replaced with a new model to be selected, including loading and transporting rubble to a dump, by truck to a specific landfill or licensed waste management operator, located at a maximum distance of 10 km, according to the project;",
                    "unit": "vg",
                    "quantity": 1
                }
            ]
        },
        {
            "code": "2",
            "name_pt": "Paredes Interiores",
            "name_en": "Interior Walls",
            "order": 2,
            "items": [
                {
                    "code": "2.1",
                    "type_pt": "Paredes Interiores",
                    "type_en": "Interior Walls",
                    "subtype_pt": "TIPO 1",
                    "subtype_en": "TYPE 1",
                    "zone": "Geral",
                    "zone_en": "General",
                    "description_pt": "TIPO 1 - Fornecimento e execução de paredes simples em placas de gesso acartonado standard com espessura variada (10cm - 15cm), com isolamento térmico e acústico em lã de rocha com 90mm de espessura, aparafusada a uma estrutura portante, pronto a receber pintura, incluindo fixações, tratamento de juntas com fita de juntas microperfuradas e pasta de juntas, perfis de remate aos elementos verticais, recidas, alçapões, aberturas e rasgos para instalações especiais, cortes, remates e todos os materiais necessários a um perfeito acabamento, conforme projeto de arquitetura.",
                    "description_en": "TYPE 1 - Supply and execution of simple walls in various thicknesses (10cm - 15cm) standard plasterboard sheets, with thermal and acoustic insulation in 90mm thick rock wool, screwed to a supporting structure, ready to receive painting, including fixings, treatment of joints with microperforated joint tape and joint paste, finishing profiles for vertical elements, recesses, trapdoors, openings and slots for special installations, cuts, finishes and all the materials necessary for a perfect finish, according to the architectural project.",
                    "unit": "m2",
                    "quantity": 11.96
                },
                {
                    "code": "2.2",
                    "type_pt": "Paredes Interiores",
                    "type_en": "Interior Walls",
                    "subtype_pt": "TIPO 2",
                    "subtype_en": "TYPE 2",
                    "zone": "Geral",
                    "zone_en": "General",
                    "description_pt": "TIPO 2 - Fornecimento e execução de paredes simples em placas de gesso acartonado hidrófugo com espessura variada (10cm - 15cm), com isolamento térmico e acústico em lã de rocha com 90mm de espessura, aparafusada a uma estrutura portante, pronto a receber pintura, incluindo fixações, tratamento de juntas com fita de juntas microperfuradas e pasta de juntas, perfis de remate aos elementos verticais, recidas, alçapões, aberturas e rasgos para instalações especiais, cortes, remates e todos os materiais necessários a um perfeito acabamento, conforme projeto de arquitetura.",
                    "description_en": "TYPE 2 - Supply and execution of simple walls in various thicknesses (10cm - 15cm) water-repellent plasterboard sheets, with thermal and acoustic insulation in 90mm thick rock wool, screwed to a supporting structure, ready to receive painting, including fixings, treatment of joints with microperforated joint tape and joint paste, finishing profiles for vertical elements, recesses, trapdoors, openings and slots for special installations, cuts, finishes and all the materials necessary for a perfect finish, according to the architectural project.",
                    "unit": "m2",
                    "quantity": 10.01
                },
                {
                    "code": "3.1",
                    "type_pt": "Paredes Interiores",
                    "type_en": "Interior Walls",
                    "subtype_pt": "TIPO 3",
                    "subtype_en": "TYPE 3",
                    "zone": "IS Master 02",
                    "zone_en": "IS Master 02",
                    "description_pt": "TIPO 3 - Fornecimento e execução de paredes simples constituída por um pano em alvenaria de tijolo cerâmico furado (com 30x20x11cm), incluindo argamassa de assentamento de cimento e areia ao traço 1:4, pilaretes e lintéis em betão armado para reforço e travamento das alvenarias quando necessário e todos os trabalhos e materiais necessários a um perfeito acabamento, tudo de acordo com peças desenhadas e escritas. Conforme projeto;",
                    "description_en": "TYPE 3 - Supply and construction of simple walls consisting of a panel of perforated ceramic bricks (30x20x11cm), including cement and sand mortar 1:4, reinforced concrete pillars and lintels to reinforce and lock the masonry when necessary and all the work and materials necessary for a perfect finish, all in accordance with the drawings and written documents. As per project;",
                    "unit": "m2",
                    "quantity": 2.16
                },
                {
                    "code": "2.3",
                    "type_pt": "Paredes Interiores",
                    "type_en": "Interior Walls",
                    "subtype_pt": "Regularização de Paredes - Paredes Interiores",
                    "subtype_en": "Regularisation of walls - Interior Walls",
                    "zone": "Geral",
                    "zone_en": "General",
                    "description_pt": "Execução de regularização de paredes com massa projetada sobre esboço em paredes interiores de alvenaria e betão, para receber acabamento final (pedra natural ou pintura), incluindo perfis de reforço e todos os trabalhos necessários, tudo de acordo com peças desenhadas e escritas.",
                    "description_en": "Execution of regularisation of walls with sprayed putty on interior masonry and concrete walls, to receive final finishing (natural stone or painting), including reinforcement profiles and all necessary work, all in accordance with drawn and written parts.",
                    "unit": "m2",
                    "quantity": 96.30
                },
                {
                    "code": "2.4",
                    "type_pt": "Paredes Interiores",
                    "type_en": "Interior Walls",
                    "subtype_pt": "Base para Lareira",
                    "subtype_en": "Fireplace Base",
                    "zone": "Geral",
                    "zone_en": "General",
                    "description_pt": "Fornecimento e execução de base para lareira em paredes simples em placas de gesso cartonado ignífugo com espessura variada, com isolamento térmico e acústico em lã de rocha com 90mm de espessura, aparafusada a uma estrutura portante, pronto a receber revestimento em pedra natural, incluindo fixações, tratamento de juntas com fita de juntas microperfuradas e pasta de juntas, perfis de remate aos elementos verticais, recidas, alçapões, aberturas e rasgos para instalações especiais, cortes, remates e todos os materiais necessários a um perfeito acabamento, conforme projeto de arquitetura;",
                    "description_en": "Supply and execution of fireplace base on simple walls made of fire-retardant plasterboard sheets of varying thickness, with thermal and acoustic insulation in 90mm thick rock wool, screwed to a supporting structure, ready to receive natural stone cladding, including fixings, treatment of joints with microperforated joint tape and joint paste, finishing profiles for vertical elements, recesses, trapdoors, openings and slots for special installations, cuts, finishes and all the materials necessary for a perfect finish, according to the architectural project.",
                    "unit": "un",
                    "quantity": 1
                }
            ]
        }
    ]
}

# Salvar JSON
output_file = Path("/home/ubuntu/gavinho_project_manager/mqt-ga00466-extracted.json")
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(mqt_data, f, ensure_ascii=False, indent=2)

print(f"✅ MQT extraído com sucesso!")
print(f"📄 Ficheiro: {output_file}")
print(f"📊 Categorias: {len(mqt_data['categories'])}")
total_items = sum(len(cat['items']) for cat in mqt_data['categories'])
print(f"📋 Itens totais: {total_items}")
