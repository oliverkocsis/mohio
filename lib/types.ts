// Core types for the new block-based data model
export type UserID = string;
export type BlockID = string;
export type Timestamp = Date;

export interface BlockStyle {
  format?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'ul' | 'ol' | 'li' | 'blockquote' | 'code';
  role?: 'title' | 'body' ;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

export interface Block {
  id: BlockID;
  canonical: string;
  html?: string;
  style?: BlockStyle;
  children?: Block[];
  createdBy: UserID;
  createdAt: Timestamp;
  updatedBy: UserID;
  updatedAt: Timestamp;
}

export interface SyntacticVariant {
  base: BlockID;
  variant: BlockID;
  variance: number;
  transformation?: string[];
  depth?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface View {
  id: string;
  type: 'document' | 'presentation';
  title: string;
  purpose: string;
  tone: string[];
  rootBlocks: Block[];
  createdBy: UserID;
  createdAt: Timestamp;
  updatedBy: UserID;
  updatedAt: Timestamp;
}


// New interfaces for the block-based system
export interface CreateViewInput {
  type: 'document' | 'presentation';
  title: string;
  purpose: string;
  tone: string[];
  rootBlocks: Block[];
  createdBy: UserID;
}

export interface UpdateViewInput {
  title?: string;
  purpose?: string;
  tone?: string[];
  rootBlocks?: Block[];
}

export interface CreateBlockInput {
  canonical: string;
  html?: string;
  style?: BlockStyle;
  children?: Block[];
  createdBy: UserID;
}

export interface UpdateBlockInput {
  canonical?: string;
  html?: string;
  style?: BlockStyle;
  children?: Block[];
}

export interface CreateSyntacticVariantInput {
  base: BlockID;
  variant: BlockID;
  variance: number;
  transformation?: string[];
  depth?: number;
}

// Storage adapter for block-based data model
export interface StorageAdapter {
  getView(id: string): Promise<View | null>
  getAllViews(): Promise<View[]>
  createView(input: CreateViewInput): Promise<View>
  updateView(id: string, input: UpdateViewInput): Promise<View | null>
  deleteView(id: string): Promise<boolean>

  getBlock(id: BlockID): Promise<Block | null>
  getAllBlocks(): Promise<Block[]>
  createBlock(input: CreateBlockInput): Promise<Block>
  updateBlock(id: BlockID, input: UpdateBlockInput): Promise<Block | null>
  deleteBlock(id: BlockID): Promise<boolean>

  getSyntacticVariant(baseId: BlockID, variantId: BlockID): Promise<SyntacticVariant | null>
  getAllSyntacticVariants(): Promise<SyntacticVariant[]>
  createSyntacticVariant(input: CreateSyntacticVariantInput): Promise<SyntacticVariant>
  deleteSyntacticVariant(baseId: BlockID, variantId: BlockID): Promise<boolean>
  
  getVariantsForBlock(blockId: BlockID): Promise<SyntacticVariant[]>
  getBaseBlocksForVariant(variantId: BlockID): Promise<SyntacticVariant[]>
}