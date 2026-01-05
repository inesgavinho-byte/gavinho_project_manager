#!/bin/bash
sed -i 's/- \[ \] Adicionar campo deletedAt às tabelas projects e constructions/- [x] Adicionar campo deletedAt às tabelas projects e constructions/' /home/ubuntu/gavinho_project_manager/todo.md
sed -i 's/- \[ \] Atualizar queries para filtrar registos não apagados (deletedAt IS NULL)/- [x] Atualizar queries para filtrar registos não apagados (deletedAt IS NULL)/' /home/ubuntu/gavinho_project_manager/todo.md
sed -i 's/- \[ \] Modificar deleteProject para fazer soft delete (set deletedAt = now())/- [x] Modificar deleteProject para fazer soft delete (set deletedAt = now())/' /home/ubuntu/gavinho_project_manager/todo.md
sed -i 's/- \[ \] Modificar deleteConstruction para fazer soft delete/- [x] Modificar deleteConstruction para fazer soft delete/' /home/ubuntu/gavinho_project_manager/todo.md
sed -i 's/- \[ \] Criar funções getTrashedProjects e getTrashedConstructions/- [x] Criar funções getTrashedProjects e getTrashedConstructions/' /home/ubuntu/gavinho_project_manager/todo.md
sed -i 's/- \[ \] Criar mutation restore para recuperar itens (set deletedAt = null)/- [x] Criar mutation restore para recuperar itens (set deletedAt = null)/' /home/ubuntu/gavinho_project_manager/todo.md
sed -i 's/- \[ \] Criar mutation permanentDelete para apagar definitivamente/- [x] Criar mutation permanentDelete para apagar definitivamente/' /home/ubuntu/gavinho_project_manager/todo.md
sed -i 's/- \[ \] Criar página Trash.tsx para visualizar lixeira/- [x] Criar página Trash.tsx para visualizar lixeira/' /home/ubuntu/gavinho_project_manager/todo.md
sed -i 's/- \[ \] Adicionar cards de estatísticas (Total, Projetos, Obras)/- [x] Adicionar cards de estatísticas (Total, Projetos, Obras)/' /home/ubuntu/gavinho_project_manager/todo.md
sed -i 's/- \[ \] Adicionar lista de itens apagados com data de deleção/- [x] Adicionar lista de itens apagados com data de deleção/' /home/ubuntu/gavinho_project_manager/todo.md
sed -i 's/- \[ \] Adicionar botões Restaurar e Apagar Permanentemente/- [x] Adicionar botões Restaurar e Apagar Permanentemente/' /home/ubuntu/gavinho_project_manager/todo.md
sed -i 's/- \[ \] Adicionar rota \/trash no App.tsx/- [x] Adicionar rota \/trash no App.tsx/' /home/ubuntu/gavinho_project_manager/todo.md
sed -i 's/- \[ \] Adicionar link Lixeira no menu DashboardLayout/- [x] Adicionar link Lixeira no menu DashboardLayout/' /home/ubuntu/gavinho_project_manager/todo.md
sed -i 's/- \[ \] Testar soft delete de projeto/- [x] Testar soft delete de projeto/' /home/ubuntu/gavinho_project_manager/todo.md
sed -i 's/- \[ \] Testar restauração de projeto/- [x] Testar restauração de projeto/' /home/ubuntu/gavinho_project_manager/todo.md
sed -i 's/- \[ \] Verificar que projeto restaurado volta para lista principal/- [x] Verificar que projeto restaurado volta para lista principal/' /home/ubuntu/gavinho_project_manager/todo.md
