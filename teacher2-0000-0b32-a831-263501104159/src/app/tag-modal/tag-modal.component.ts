import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CoreService } from "../core.service";
import { ConfirmDialogService } from "../shared/dialog/confirm-dialog.service";
import { ModalSize } from "../shared/dialog/confirm-dialog/confirm-dialog";
import { TagRec } from "../data/teacher";
@Component({
  selector: "app-tag-modal",
  templateUrl: "./tag-modal.component.html",
  styleUrls: ["./tag-modal.component.scss"],
})
export class TagModalComponent implements OnInit {
  mode: "add" | "edit" | "del" | "view" = "view";
  saving = false;
  errMsg = "";
  tempTag: TagRec = {
    Name: "",
    Color: "#ffffff",
    Prefix: "",
    TagId: "",
    AccessControlCode: "",
    UsageCount: 0,
  };
  prefixList: { id: string; Prefix: string }[] = [];

  selectPrefix = "all";
  isAddingNewGroup = false;
  tempPrefix = "";
  rawTagList: TagRec[] = [];
  filteredTagList: TagRec[] = [];
  IsEnableEdit = false;
  selectedTag: TagRec;

  constructor(
    public dialogRef: MatDialogRef<TagModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tags: TagRec[] },
    private coreSrv: CoreService,
    public confirmSrv: ConfirmDialogService
  ) {
    this.rawTagList = data.tags;
  }

  ngOnInit(): void {
    this.filteredTagList = this.rawTagList;
    this.prefixList = this.getPrefixList(this.rawTagList);
  }

  getPrefixList(tagList: TagRec[]) {
    const nameList: { Prefix: string }[] = [];
    // id為流水編號
    tagList.forEach((item) => {
      if (!nameList.find((x) => x.Prefix === item.Prefix)) {
        nameList.push({ Prefix: item.Prefix });
      }
    });
    // 加上id為流水編號
    const prefixList: { id: string; Prefix: string }[] = [];
    nameList.map((item, index) => {
      prefixList.push({ id: index.toString(), Prefix: item.Prefix });
    });
    return prefixList;
  }

  filterTagList() {
    if (this.selectPrefix === "all") {
      this.filteredTagList = this.rawTagList;
    } else {
      // 過濾
      let selectedPrefix = this.prefixList.find(
        (item) => item.id === this.selectPrefix
      );
      this.filteredTagList = this.rawTagList.filter(
        (item) => item.Prefix === selectedPrefix.Prefix
      );
    }
  }

  addTagClick() {
    this.mode = "add";
    this.errMsg = "";
    this.isAddingNewGroup = false;
    this.IsEnableEdit = false;
    this.tempTag = {
      Name: "",
      Color: "#ffffff",
      Prefix: "",
      TagId: "",
      AccessControlCode: "",
      UsageCount: 0,
    };
  }

  editTagClick(tag: TagRec) {
    this.mode = "edit";
    this.errMsg = "";
    this.isAddingNewGroup = false;
    this.tempTag = { ...tag };
    this.selectedTag = { ...tag };
    if (this.tempTag.AccessControlCode) {
      this.errMsg = "該類別無法修改";
      this.IsEnableEdit = true;
    } else {
      this.IsEnableEdit = false;
    }
  }

  addGroupClick() {
    this.isAddingNewGroup = true;
    this.tempPrefix = "";
    // focus input
    setTimeout(() => {
      const input = document.querySelector(
        "input[name='edit-Prefix']"
      ) as HTMLInputElement;
      input?.focus();
    }, 100);
  }

  cancelAddGroup() {
    this.isAddingNewGroup = false;
  }

  async updateTag() {
    this.errMsg = "";
    if (this.saving) {
      return;
    }
    const tempPrefix = this.isAddingNewGroup
      ? this.tempPrefix
      : this.tempTag.Prefix;

    if (this.mode === "add") {
      if (!this.tempTag.Name) {
        this.errMsg = "請輸入類別名稱";
        return;
      }
      // 檢查是否有同Prefix的TagName
      if (
        this.rawTagList.find(
          (item) =>
            item.Name === this.tempTag.Name && item.Prefix === tempPrefix
        )
      ) {
        this.errMsg = "該群組內已存在相同類別名稱";
        return;
      }

      try {
        this.saving = true;
        const data = {
          TagName: this.tempTag.Name,
          Color: this.BGR_hex2BGR_negative(this.tempTag.Color),
          Prefix: tempPrefix,
        };
        await this.coreSrv.addTag(data);
        try {
          await this.coreSrv.addLog(
            "Record",
            "新增類別",
            `類別：${
              this.tempTag.Name
            }，群組：${tempPrefix}。\n詳細資料：${JSON.stringify(data)}`
          );
        } catch (error) {}
        this.confirmRefresh();
      } catch (error) {
        this.errMsg = "新增失敗";
        if (error.dsaError && error.dsaError.message) {
          this.errMsg = error.dsaError.message;
        }
      } finally {
        this.saving = false;
      }
    } else if (this.mode === "edit") {
      if (!this.tempTag.Name) {
        this.errMsg = "請輸入類別名稱";
        return;
      }
      if (
        this.rawTagList.find(
          (item) =>
            item.Name === this.tempTag.Name &&
            item.Prefix === tempPrefix &&
            item.TagId !== this.tempTag.TagId
        )
      ) {
        this.errMsg = "該群組內已存在相同類別名稱";
        return;
      }
      try {
        this.saving = true;
        const data = {
          TagId: this.tempTag.TagId,
          TagName: this.tempTag.Name,
          Color: this.BGR_hex2BGR_negative(this.tempTag.Color),
          Prefix: tempPrefix,
        };
        await this.coreSrv.updateTag(data);
        try {
          await this.coreSrv.addLog(
            "Record",
            "編輯類別",
            `類別：${this.tempTag.Name}，類別系統編號：${
              this.tempTag.TagId
            }，群組：${tempPrefix}。\n詳細資料：${JSON.stringify(data)}`
          );
        } catch (error) {}
        this.confirmRefresh();
      } catch (error) {
        this.errMsg = "更新失敗";
        if (error.dsaError && error.dsaError.message) {
          this.errMsg = error.dsaError.message;
        }
      } finally {
        this.saving = false;
      }
    }
  }

  confirmRefresh() {
    this.confirmSrv.show({
      message: `${
        this.mode === "add" ? "新增" : this.mode === "del" ? "刪除" : "編輯"
      }類別已儲存成功！`,
      header: "",
      acceptLabel: "確定",
      rejectLabel: "",
      accept: () => {
        this.confirmSrv.hide();
        this.dialogRef.close({ state: "refresh" });
      },
      modalSize: ModalSize.LG,
      acceptButtonStyleClass: "bg-primary",
      rejectVisible: false,
    });
  }

  confirmDel() {
    if (this.tempTag.AccessControlCode) {
      this.errMsg = "該類別無法刪除";
      return;
    }
    this.confirmSrv.show({
      message:
        "目前有" +
        this.tempTag.UsageCount +
        "位教師使用該類別，永久刪除後無法恢復，您確定要刪除嗎？",
      header: "刪除類別",
      acceptLabel: "刪除",
      rejectLabel: "取消",
      accept: () => this.delTag(),
      modalSize: ModalSize.MD,
      acceptButtonStyleClass: "bg-warning hover:bg-warning hover:bg-opacity-70",
    });
  }

  async delTag() {
    this.errMsg = "";
    this.mode = "del";
    if (this.saving) {
      return;
    }

    try {
      this.saving = true;
      const data = {
        TagId: this.tempTag.TagId,
      };
      await this.coreSrv.delTag(data);

      try {
        await this.coreSrv.addLog(
          "Record",
          "刪除類別",
          `類別系統編號：${this.tempTag.TagId}。\n詳細資料：${JSON.stringify(
            this.selectedTag
          )}`
        );
      } catch (error) {}
      this.confirmSrv.hide();
      this.confirmRefresh();
    } catch (error) {
      this.errMsg = "刪除失敗";
      if (error.dsaError && error.dsaError.message) {
        this.errMsg = error.dsaError.message;
      }
    } finally {
      this.saving = false;
    }
  }

  /** 色碼轉譯 */
  BGR_hex2BGR_negative(hex: string): number {
    // 確保 hex 格式正確
    const isValid = /^#[0-9A-F]{6}$/i.test(hex);
    if (!isValid) {
      return -1;
    }

    const cleanedHex = hex.replace("#", "").toUpperCase();
    // 補上 `FF` 作為完全不透明
    const rgb = `FF${cleanedHex}`;

    let intValue = parseInt(rgb, 16) | 0;
    // 確保輸出的顏色碼是有效的格式，否則輸出-1
    if (intValue > 0xffffff) {
      intValue = -1;
    }

    return intValue;
  }
}
