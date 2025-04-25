import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CoreService } from "../core.service";
import { ConfirmDialogService } from "../shared/dialog/confirm-dialog.service";
import { ModalSize } from "../shared/dialog/confirm-dialog/confirm-dialog";
import { TagRec, TagTeacherRec } from "../data/teacher";
@Component({
  selector: "app-tag-select-modal",
  templateUrl: "./tag-select-modal.component.html",
  styleUrls: ["./tag-select-modal.component.scss"],
})
export class TagSelectModalComponent implements OnInit {
  selectedTeacherTags: TagTeacherRec[] = [];

  prefixList: { id: string; Prefix: string }[] = [];

  selectPrefix = "all";
  isAddingNewGroup = false;
  tempPrefix = "";

  rawTagList: TagRec[] = [];

  filteredTagList: TagRec[] = [];

  constructor(
    public dialogRef: MatDialogRef<TagSelectModalComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { tags: TagTeacherRec[]; tagList: TagRec[] },
    private coreSrv: CoreService,
    public confirmSrv: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    // 檢查是否有傳入的 tags 資料，然後進行複製
    if (this.data.tags) {
      this.selectedTeacherTags = this.data.tags.map((tag) => {
        return {
          TagId: tag.TagId,
          TagTeacherId: "",
          Name: tag.Name,
          Color: tag.Color,
          Prefix: tag.Prefix,
          AccessControlCode: tag.AccessControlCode,
        };
      });
    }

    this.rawTagList = this.data.tagList;
    this.prefixList = this.getPrefixList(this.rawTagList);
    this.filteredTagList = this.rawTagList;
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
  isTagIncluded(tag: TagRec) {
    return this.selectedTeacherTags.some((item) => item.TagId === tag.TagId);
  }

  filterTagList() {
    if (this.selectPrefix === "all") {
      this.filteredTagList = this.rawTagList;
    } else {
      this.filteredTagList = this.rawTagList.filter(
        (item) => item.Prefix === this.selectPrefix
      );
    }
  }

  editTagClick(tag: TagRec) {
    if (this.isTagIncluded(tag)) {
      this.selectedTeacherTags = this.selectedTeacherTags.filter(
        (item) => item.TagId !== tag.TagId
      );
    } else {
      this.selectedTeacherTags.push({
        TagId: tag.TagId,
        TagTeacherId: "",
        Name: tag.Name,
        Color: tag.Color,
        Prefix: tag.Prefix,
        AccessControlCode: tag.AccessControlCode,
      });
    }
  }

  updateTag() {
    this.dialogRef.close({
      state: "refresh",
      tags: this.selectedTeacherTags.sort((a, b) => {
        // 1. 沒有 Prefix 的 tag 在最後面
        if (!a.Prefix && b.Prefix) return 1;
        if (a.Prefix && !b.Prefix) return -1;

        // 2. 依照 Prefix 排序
        const prefixCompare = a.Prefix.localeCompare(b.Prefix, "zh-hant");
        if (prefixCompare !== 0) return prefixCompare;

        // 3. 若 Prefix 相同，依照 Name 排序
        return a.Name.localeCompare(b.Name, "zh-hant");
      }),
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
