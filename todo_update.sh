#!/bin/bash
cd /home/ubuntu/gavinho_project_manager
sed -i 's/- \[ \] Adicionar botão Apagar na página ConstructionDetails/- [x] Adicionar botão Apagar na página ConstructionDetails/' todo.md
sed -i 's/- \[ \] Criar modal de confirmação de deleção de obra/- [x] Criar modal de confirmação de deleção de obra/' todo.md
sed -i 's/- \[ \] Implementar soft delete para obras/- [x] Implementar soft delete para obras/' todo.md
sed -i 's/- \[ \] Integrar obras apagadas na página Lixeira/- [x] Integrar obras apagadas na página Lixeira/' todo.md
sed -i 's/- \[ \] Testar fluxo completo de deleção e restauração de obras/- [x] Testar fluxo completo de deleção e restauração de obras/' todo.md
