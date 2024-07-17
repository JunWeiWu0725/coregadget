import { RoleService } from "./role.service";


export function appInitializerFactory(roleSrv: RoleService) {
  return () => roleSrv.reload();
}