import { QuestionDisableVO } from 'src/app/admin/comprehensive/comprehensive.component';

/**
 *
 * QuestionSubject -vo
 * @export
 * @class QuestionSubject
 */
export class QuestionSubject {
    constructor(questionInfo: QuestionInfo) {
        this.AddGroup(questionInfo);
        this.SubjectText = questionInfo.QuestionSubject;
    }

    SubjectText: string;
    IsSetDisable: boolean;
    IsDisable: boolean;
    QuestionGroup: QuestionGroup[] = [];
    QuestionGroupMap: Map<string, QuestionGroup> = new Map<string, QuestionGroup>();
    SelectQuestionID: string[];



    ischildAllCheck (){
        if( this.GetQuestionGroups().find(x=>(x.IsSetDisable))){

            return true
        }else {

            return false
        }

    }
    /**
     *
     * 看看有沒有GroupName
     * @memberof QuestionSubject
     */
    HasGroupName(groupName: string): boolean {
        return this.QuestionGroupMap.has(groupName);

    }

    GetQuestionGroups(): QuestionGroup[] {


        return Array.from(this.QuestionGroupMap.values());


    }


    /**
     *
     *加入Group
     * @param {QuestionInfo} questionInfo
     * @memberof QuestionSubject
     */
    public AddGroup(questionInfo: QuestionInfo) {


        if(questionInfo.IsDisable =='true'){
            this.IsSetDisable  = (questionInfo.IsDisable =='true') ; // 需要註解掉
            this.IsDisable  = (questionInfo.IsDisable =='true') ;

        }
        // tslint:disable-next-line: no-use-before-declare
        if (!this.QuestionGroupMap.has(questionInfo.QuestionGroup)) {
            this.QuestionGroupMap.set(questionInfo.QuestionGroup, new QuestionGroup(questionInfo));
            this.QuestionGroup.push(new QuestionGroup(questionInfo));

        } else {

            const questionGroup: QuestionGroup = this.QuestionGroupMap.get(questionInfo.QuestionGroup);
            questionGroup.AddQuery(questionInfo);

        }
    }

    /**
     * 顯示是不是要 顯示勾勾
     */
    public ShowCheck(): boolean {
        return (this.IsSetDisable && this.QuestionGroupMap.size == 0);
    }
    /**
     * 取得
     *
     * @param {boolean} isChecked
     * @memberof QuestionSubject
     */
    public SubjectCheckChildIsChecked(isChecked: boolean ,updateLists? :QuestionDisableVO[]) {

        this.IsSetDisable = !isChecked;
        [].concat(Array.from(this.QuestionGroupMap.values())).forEach((questionGroup: QuestionGroup) => {
            // questionGroup.IsChecked = true;
            questionGroup.QueryCheckChildIsChecked(isChecked,updateLists);

        });



    }
}
/**
 *
 * QuestionGroup -vo
 * @export
 * @class QuestionGroup
 */
export class QuestionGroup {
    constructor(questionInfo: QuestionInfo) {
        this.GroupText = questionInfo.QuestionGroup;
        this.QuestionCode =questionInfo.QuestionCode ;
        this.AddQuery(questionInfo);
        this.IsSetDisable  = (questionInfo.IsDisable =='true') ; // 需要註解掉
        this.IsDisable  = (questionInfo.IsDisable =='true') ;
    }
    QuestionCode :string ;
    GroupText: string;
    IsSetDisable: boolean = false ;
    IsDisable: boolean  = false ;
    QuestionQuery: QuestionQuery[] = [];
    QuestionQueryMap: Map<string, QuestionQuery> = new Map<string, QuestionQuery>();

    ischildAllCheck (){
        if( this.GetQuestionQuerys().find(x=>(x.IsSetDisable))){
            return true
        }else {

            return false
        }
    }
    /**
     *
     * 看看有沒有GroupName
     * @memberof QuestionSubject
     */
    HasQueryName(groupName: string): boolean {
        return this.QuestionQueryMap.has(groupName);
    }
    /**
     *
     *加入Group
     * @param {QuestionInfo} questionInfo
     * @memberof QuestionSubject
     */
    AddQuery(questionInfo: QuestionInfo) {
        if (!this.QuestionQueryMap.has(questionInfo.QuestionQuery)) {
            this.QuestionQuery.push(new QuestionQuery(questionInfo));
            this.QuestionQueryMap.set(questionInfo.QuestionQuery, new QuestionQuery(questionInfo));

        } else {


            const questionQuery: QuestionQuery = this.QuestionQueryMap.get(questionInfo.QuestionQuery);

            questionQuery.AddQuestionText(questionInfo);




        }

    }

    GetQuestionQuerys(): QuestionQuery[] {


        return Array.from(this.QuestionQueryMap.values());


    }

    public QueryCheckChildIsChecked(isChecked: boolean ,updateLists? :QuestionDisableVO[]) {
        console.log("updateLists",updateLists)
        this.IsSetDisable = !isChecked;
        [].concat(Array.from(this.QuestionQueryMap.values())).forEach((questionQuery: QuestionQuery) => {
            // alert("sss")
            questionQuery.QueryCheckChildIsChecked(isChecked,updateLists);
            if (updateLists)
            {
                // updateLists = updateLists.filter(x => x.QuestionCode !== this.QuestionCode);
                updateLists.push({ QuestionCode: this.QuestionCode, IsDisable: this.IsSetDisable })
                //  alert("SSF")
           }
        });

    }
}

export class QuestionQuery {
    constructor(questionInfo: QuestionInfo) {
        this.QueryText = questionInfo.QuestionQuery;
        this.QuestionCode = questionInfo.QuestionCode ;
        this.IsSetDisable = (questionInfo.IsDisable =='true')
        this.IsDisable = (questionInfo.IsDisable =='true')
        this.AddQuestionText(questionInfo);
    }
    QuestionCode: string ;
    QueryText: string ;
    IsSetDisable: boolean  ;
    IsDisable : boolean
    hasChild: boolean = false ;
    ShowChecked: boolean = false ;
    QuestionText: QuestionText[] = [];
    QuestionTextMap: Map<string, QuestionText> = new Map<string, QuestionText>(); // question_code
    ischildAllCheck (){
        if( this.GetQuestionText().find(x=>(x.IsSetDisable))){

            return true
        }else {

            return false
        }

    }
    /**
    *
    * 看看有沒有GroupName
    * @memberof QuestionSubject
    */
    HasQueryName(groupName: string): boolean {
        return this.QuestionTextMap.has(groupName);
    }
    /**
     *
     *加入Group
     * @param {QuestionInfo} questionInfo
     * @memberof QuestionSubject
     */
    AddQuestionText(questionInfo: QuestionInfo) {

        if (questionInfo.QuestionText) {
            this.hasChild = true;
        }
        if (!this.QuestionTextMap.has(questionInfo.QuestionCode)) {
            this.QuestionTextMap.set(questionInfo.QuestionCode, new QuestionText(questionInfo));
            this.QuestionText.push(new QuestionText(questionInfo));
        } else {



        }
    }
    GetQuestionText(): QuestionText[] {
        return Array.from(this.QuestionTextMap.values());
    }


    public ShowCheck(): boolean {

        return (this.IsSetDisable && this.hasChild);
    }

    public QueryCheckChildIsChecked(IsCheck: boolean,updateLists? :QuestionDisableVO[]) {

        this.IsSetDisable = !IsCheck;
        this.ShowChecked = !IsCheck && !this.hasChild;
        [].concat(Array.from(this.QuestionTextMap.values())).forEach((questionText: QuestionText) => {
            questionText.TextCheckChildIsChecked(IsCheck ,updateLists);
            updateLists.push({ QuestionCode: this.QuestionCode, IsDisable: this.IsSetDisable })


        });


    }
}

/** 小題 */
export class QuestionText {
    constructor(questionInfo: QuestionInfo) {
        this.QuestionText = questionInfo.QuestionText;
        this.QuestionCode = questionInfo.QuestionCode;
        this.IsSetDisable  = (questionInfo.IsDisable =='true') ; // 需要註解掉
        this.IsDisable  = (questionInfo.IsDisable =='true') ;

      console.log( questionInfo.QuestionText +questionInfo.IsDisable)
    }
    QuestionText: string;
    IsSetDisable: boolean ;
    IsDisable : boolean ;
    ShowDetail: boolean = false;
    OptionTextMap: Map<string, OptionTextInfo> = new Map<string, OptionTextInfo>(); // question_code
    QuestionCode: string;
    public TextCheckChildIsChecked(IsCheck: boolean ,updateLists :QuestionDisableVO[]) {
        this.IsSetDisable = ! IsCheck;

        // updateLists = updateLists.filter(x => x.QuestionCode !== this.QuestionCode);
        updateLists.push({ QuestionCode: this.QuestionCode, IsDisable: this.IsSetDisable })
        console.log(updateLists)
        // alert( this.QuestionCode +updateLists.length)


    }
}

/** 小題 */
export class OptionText {
    constructor(questionInfo: QuestionInfo) {
        this.QuestionText = questionInfo.OptionText;
        this.QuestionCode = questionInfo.OptionCode;
        this.IsChecked  = (questionInfo.IsDisable =='true') ;
      console.log( questionInfo.QuestionText +questionInfo.IsDisable)
    }
    UID :string ;
    QuestionText: string;
    IsChecked: boolean ;
    IsDisable : boolean ;
    ShowDetail: boolean = false;
    OptionTextMap: Map<string, OptionTextInfo> = new Map<string, OptionTextInfo>(); // question_code
    QuestionCode: string;
    public CheckChildIsChecked(IsCheck: boolean) {
        this.IsChecked = !IsCheck;

    }
}



export interface QuestionInfo {
    /** 最後小題  */
    UID? :string  ;
    OptionCode : string ;
    OptionText :string  ;
    QuestionCode: string;
    QuestionSubject: string;
    QuestionGroup: string;
    QuestionQuery: string;
    QuestionText: string;
    IsDisable : string ;
}

export interface OptionTextInfo {
    UID :string ;
    OptionText :string;

    IsDisable : string ;
}

export interface SectionInfo {
    SectionID: string;
    SectionName: string;
    Respondent: string;
}