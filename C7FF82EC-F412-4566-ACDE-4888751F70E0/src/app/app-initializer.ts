import { RoleService } from "./role.service";


export function appInitializerFactory(roleSrv: RoleService) {

  const getContract = async (contractName: string): Promise<any> => {
    const connection = await new Promise<any>((r, j) => {
      const contract = gadget.getContract(contractName);
      contract.ready(() => {
        r(contract);
      });
      contract.loginFailed(err => {
        j(err);
      });
    });
    return connection;
  };

  const send = async (contractName: string, serviceName: string, body: any = {}): Promise<any> => {
    const conn = await getContract(contractName);
    return new Promise<any>((r, j) => {
      conn.send({
        service: serviceName,
        body: body,
        result: (rsp, err, xmlhttp) => {
          if (err) {
            j(err);
          } else {
            r(rsp);
          }
        }
      });
    });
  };

  return () => {
    return new Promise<void>(async(r, j) => {
      try {
        const resp = await send('web3.v1.guest', 'GetRoleInfo');

        if (resp.Users) {
          const RoleInfo: { Role: string, Name: string, ID: string }[] = [].concat(resp.Users.User || []);
          const isTeacher = RoleInfo.some(x => x.Role == 'teacher');
          const isStudent = RoleInfo.some(x => x.Role == 'student');

          roleSrv.isTeacher = isTeacher;
          roleSrv.isStudent = isStudent;

          if (isTeacher) {
            await roleSrv.reload();
          }
        }
        r();
      } catch (error) {
        console.log(error);
        r();
      }
    });
  }
}