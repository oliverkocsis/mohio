export class ProductBacklogItem {

    constructor(
        public description: string,
        public order: number,
        public estimate: number,
        public value: number) { }

    public id: any;

    static empty(): { [key: string]: any; } {
        return new ProductBacklogItem("", 0, 0, 0);
    }
}
