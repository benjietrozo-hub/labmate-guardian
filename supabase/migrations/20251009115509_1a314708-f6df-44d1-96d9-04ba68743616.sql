-- Create incident_reports table
CREATE TABLE IF NOT EXISTS public.incident_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article VARCHAR(255) NOT NULL,
    description TEXT,
    serial_number VARCHAR(100),
    date_acquired DATE,
    po_number VARCHAR(100),
    property_number VARCHAR(100),
    new_property_number VARCHAR(100),
    unit_of_measure VARCHAR(50),
    unit_value DECIMAL(10,2),
    balance_per_card_qty INT,
    on_hand_per_card_qty INT,
    total_value DECIMAL(10,2),
    accredited_to VARCHAR(255),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create lost_found table
CREATE TABLE IF NOT EXISTS public.lost_found (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    time TIME NOT NULL,
    item_description TEXT NOT NULL,
    finders_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    cell_number VARCHAR(20),
    date_claimed DATE,
    signature VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create inventory_equipment table
CREATE TABLE IF NOT EXISTS public.inventory_equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    item_description TEXT NOT NULL,
    serial_number VARCHAR(100),
    quantity INT NOT NULL DEFAULT 1,
    purpose TEXT,
    signature VARCHAR(255),
    date_returned DATE,
    condition VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create borrow_items table
CREATE TABLE IF NOT EXISTS public.borrow_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    borrower_name VARCHAR(255) NOT NULL,
    item VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    borrow_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) DEFAULT 'Borrowed' CHECK (status IN ('Borrowed', 'Returned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create visitor_logs table
CREATE TABLE IF NOT EXISTS public.visitor_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    date DATE NOT NULL,
    time_in TIME NOT NULL,
    time_out TIME,
    signature VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create repair_maintenance table
CREATE TABLE IF NOT EXISTS public.repair_maintenance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    equipment_name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100),
    issue_description TEXT NOT NULL,
    action_taken TEXT,
    technician_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_maintenance ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for incident_reports
CREATE POLICY "Anyone can view incident reports" ON public.incident_reports FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create incident reports" ON public.incident_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update incident reports" ON public.incident_reports FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete incident reports" ON public.incident_reports FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create RLS Policies for lost_found
CREATE POLICY "Anyone can view lost and found" ON public.lost_found FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create lost found entries" ON public.lost_found FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update lost found entries" ON public.lost_found FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete lost found entries" ON public.lost_found FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create RLS Policies for inventory_equipment
CREATE POLICY "Anyone can view inventory" ON public.inventory_equipment FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create inventory items" ON public.inventory_equipment FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update inventory items" ON public.inventory_equipment FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete inventory items" ON public.inventory_equipment FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create RLS Policies for borrow_items
CREATE POLICY "Anyone can view borrow records" ON public.borrow_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create borrow records" ON public.borrow_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update borrow records" ON public.borrow_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete borrow records" ON public.borrow_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create RLS Policies for visitor_logs
CREATE POLICY "Anyone can view visitor logs" ON public.visitor_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create visitor logs" ON public.visitor_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update visitor logs" ON public.visitor_logs FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete visitor logs" ON public.visitor_logs FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create RLS Policies for repair_maintenance
CREATE POLICY "Anyone can view repairs" ON public.repair_maintenance FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create repair records" ON public.repair_maintenance FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update repair records" ON public.repair_maintenance FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete repair records" ON public.repair_maintenance FOR DELETE USING (auth.uid() IS NOT NULL);