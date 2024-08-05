import { Injectable, NgZone } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class DsaService {
  private connection: any;
  AccessPoint: string;
  SessionID: any;

  constructor(private zone: NgZone) {}

  private async getContract(
    contractName: string = "1campus.counsel.teacher"
  ): Promise<any> {
    if (!this.connection) {
      const contract = gadget.getContract(contractName);
      this.connection = await new Promise<any>((r, j) => {
        contract.ready(() => {
          r(contract);
        });
        contract.loginFailed(err => {
          j(err);
        });
      });
    }
    return this.connection;
  }

  public async getSessionIDAndAccessPoint() {
    const c = await this.getContract("1campus.counsel.teacher");
    const session = await this.send("DS.Base.Connect", {
      RequestSessionID: ""
    });
    this.SessionID = session.SessionID;
    this.AccessPoint = c.getAccessPoint();
  }

  public async send(serviceName: string, body: any = {}): Promise<any> {
    const conn = await this.getContract();
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
  }
}
